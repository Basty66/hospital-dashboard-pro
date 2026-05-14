from rest_framework import serializers
from .models import Servicio, Cama, Indicador, ValorIndicador, GestionClinica, ListaEspera, Nivel, Egreso, ServicioGrd, OportunidadHospitalizacion

class CamaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cama
        fields = '__all__'

class ServicioSerializer(serializers.ModelSerializer):
    camas = CamaSerializer(many=True, read_only=True)

    class Meta:
        model = Servicio
        fields = ['id', 'codigo', 'nombre', 'piso', 'camas']

class IndicadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indicador
        fields = '__all__'

class ValorIndicadorSerializer(serializers.ModelSerializer):
    indicador_nombre = serializers.CharField(source='indicador.nombre', read_only=True)
    unidad = serializers.CharField(source='indicador.unidad', read_only=True)

    class Meta:
        model = ValorIndicador
        fields = ['id', 'servicio', 'indicador', 'indicador_nombre', 'unidad', 'anio', 'mes', 'valor_calculado']

class GestionClinicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = GestionClinica
        fields = '__all__'

class ListaEsperaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListaEspera
        fields = '__all__'


class EgresoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Egreso
        fields = '__all__'


class NivelSerializer(serializers.ModelSerializer):
    egresos = EgresoSerializer(many=True, read_only=True)

    class Meta:
        model = Nivel
        fields = ['id', 'codigo', 'nombre', 'tipo', 'color', 'egresos']


class ServicioGrdSerializer(serializers.ModelSerializer):
    servicio_codigo = serializers.CharField(source='servicio.codigo', read_only=True)
    servicio_nombre = serializers.CharField(source='servicio.nombre', read_only=True)

    class Meta:
        model = ServicioGrd
        fields = '__all__'


class OportunidadHospitalizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OportunidadHospitalizacion
        fields = '__all__'