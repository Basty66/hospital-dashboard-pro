# dashboard/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.db.models import Sum
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime
from .models import Servicio, Cama, Indicador, ValorIndicador, GestionClinica, ListaEspera, Nivel, Egreso, ServicioGrd, OportunidadHospitalizacion
from .serializers import (
    ServicioSerializer, CamaSerializer, IndicadorSerializer, 
    ValorIndicadorSerializer, GestionClinicaSerializer, ListaEsperaSerializer,
    NivelSerializer, EgresoSerializer, ServicioGrdSerializer, OportunidadHospitalizacionSerializer
)

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(username=username, password=password)
    if user:
        login(request, user)
        return Response({"mensaje": "Sesión iniciada", "user": user.username})
    return Response({"error": "Credenciales incorrectas"}, status=401)


@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"mensaje": "Sesión cerrada"})


@api_view(["GET"])
def csrf_token_view(request):
    from django.middleware.csrf import get_token
    return Response({"csrfToken": get_token(request)})


@api_view(["GET"])
def me_view(request):
    if request.user.is_authenticated:
        return Response({"user": request.user.username})
    return Response({"error": "No autenticado"}, status=401)


class ServicioViewSet(viewsets.ModelViewSet):
    queryset = Servicio.objects.all()
    serializer_class = ServicioSerializer

class CamaViewSet(viewsets.ModelViewSet):
    queryset = Cama.objects.all()
    serializer_class = CamaSerializer
    filterset_fields = ['servicio', 'estado', 'nivel_cuidado'] 

class IndicadorViewSet(viewsets.ModelViewSet):
    queryset = Indicador.objects.all()
    serializer_class = IndicadorSerializer

class ValorIndicadorViewSet(viewsets.ModelViewSet):
    queryset = ValorIndicador.objects.all()
    serializer_class = ValorIndicadorSerializer
    filterset_fields = ['servicio', 'anio', 'mes', 'indicador']

class GestionClinicaViewSet(viewsets.ModelViewSet):
    queryset = GestionClinica.objects.all()
    serializer_class = GestionClinicaSerializer
    filterset_fields = ['servicio', 'anio', 'mes']

class ListaEsperaViewSet(viewsets.ModelViewSet):
    queryset = ListaEspera.objects.all()
    serializer_class = ListaEsperaSerializer
    filterset_fields = ['servicio', 'especialidad', 'tipo_atencion']


class NivelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Nivel.objects.all().prefetch_related("egresos")
    serializer_class = NivelSerializer


class EgresoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Egreso.objects.all()
    serializer_class = EgresoSerializer
    filterset_fields = ['nivel']


class ServicioGrdViewSet(viewsets.ModelViewSet):
    queryset = ServicioGrd.objects.all().select_related("servicio")
    serializer_class = ServicioGrdSerializer
    filterset_fields = ['servicio', 'anio']


class OportunidadHospitalizacionViewSet(viewsets.ModelViewSet):
    queryset = OportunidadHospitalizacion.objects.all()
    serializer_class = OportunidadHospitalizacionSerializer
    filterset_fields = ['year', 'month']


@api_view(['GET'])
def dashboard_kpi(request):
    total = Nivel.objects.filter(codigo="0").prefetch_related("egresos").first()
    data = {"ocupacion": 0, "total_egresos": 0, "servicios_criticos": []}

    if total:
        aggs = Egreso.objects.filter(nivel=total).aggregate(
            disponibles=Sum("dias_cama_disponibles"),
            ocupados=Sum("dias_cama_ocupados"),
            total_altas=Sum("altas"),
            total_fallecidos=Sum("fallecidos"),
            total_traslados=Sum("traslados"),
            total_dias_estada=Sum("dias_estada"),
        )
        disponibles = aggs["disponibles"] or 0
        ocupados = aggs["ocupados"] or 0
        altas = aggs["total_altas"] or 0
        fallecidos = aggs["total_fallecidos"] or 0
        traslados = aggs["total_traslados"] or 0
        dias_estada = aggs["total_dias_estada"] or 0
        total_egresos = altas + fallecidos + traslados

        data["ocupacion"] = round((ocupados / disponibles * 100), 1) if disponibles else 0
        data["total_egresos"] = total_egresos
        data["promedio_estada"] = round((dias_estada / total_egresos), 1) if total_egresos else 0
        data["tasa_letalidad"] = round((fallecidos / total_egresos * 100), 1) if total_egresos else 0

        servicios = Nivel.objects.exclude(codigo="0").prefetch_related("egresos")
        for s in servicios:
            ocu = Egreso.objects.filter(nivel=s).aggregate(
                d=Sum("dias_cama_disponibles"), o=Sum("dias_cama_ocupados")
            )
            pct = round((ocu["o"] or 0) / (ocu["d"] or 1) * 100, 1)
            if pct > 90:
                data["servicios_criticos"].append({"nombre": s.nombre, "ocupacion": pct})

    return Response(data)


@api_view(["POST"])
def importar_rem(request):
    niveles_data = request.data.get("niveles", request.data if isinstance(request.data, list) else [])
    if isinstance(niveles_data, dict) and "niveles" in request.data:
        niveles_data = request.data["niveles"]

    creados = 0
    for item in niveles_data:
        nivel, _ = Nivel.objects.get_or_create(
            codigo=item["codigo"],
            defaults={
                "nombre": item["nombre"],
                "tipo": item.get("nivel_cuidado", {}).get("tipo", "General"),
                "color": item.get("nivel_cuidado", {}).get("color", "primary"),
            },
        )
        for eg in item.get("egresos", []):
            anio, mes = eg["mes"].split("-")
            _, created = Egreso.objects.update_or_create(
                nivel=nivel,
                mes=datetime(int(anio), int(mes), 1),
                defaults={
                    "altas": eg["altas"],
                    "traslados": eg["traslados"],
                    "fallecidos": eg["fallecidos"],
                    "dias_cama_disponibles": eg["dias_cama_disponibles"],
                    "dias_cama_ocupados": eg["dias_cama_ocupados"],
                    "dias_estada": eg["dias_estada"],
                },
            )
            if created:
                creados += 1

    return Response({
        "mensaje": "Importacion completada",
        "niveles": Nivel.objects.count(),
        "egresos": Egreso.objects.count(),
    }, status=status.HTTP_201_CREATED)