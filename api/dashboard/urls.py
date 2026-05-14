# dashboard/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    login_view, logout_view, me_view, csrf_token_view,
    ServicioViewSet, CamaViewSet, IndicadorViewSet, 
    ValorIndicadorViewSet, GestionClinicaViewSet, ListaEsperaViewSet,
    NivelViewSet, EgresoViewSet, dashboard_kpi, importar_rem,
    ServicioGrdViewSet, OportunidadHospitalizacionViewSet
)

router = DefaultRouter()
router.register(r'servicios', ServicioViewSet)
router.register(r'camas', CamaViewSet)
router.register(r'indicadores', IndicadorViewSet)
router.register(r'valores-indicadores', ValorIndicadorViewSet)
router.register(r'gestion-clinica', GestionClinicaViewSet)
router.register(r'lista-espera', ListaEsperaViewSet)
router.register(r'niveles', NivelViewSet)
router.register(r'egresos', EgresoViewSet)
router.register(r'servicios-grd', ServicioGrdViewSet)
router.register(r'oportunidad-hospitalizacion', OportunidadHospitalizacionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_kpi, name='dashboard-kpi'),
    path('importar-rem/', importar_rem, name='importar-rem'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path('auth/csrf/', csrf_token_view, name='csrf'),
]