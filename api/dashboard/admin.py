# dashboard/admin.py
from django.contrib import admin
from .models import Servicio, Cama, Indicador, ValorIndicador, GestionClinica, ListaEspera, Nivel, Egreso, ServicioGrd, OportunidadHospitalizacion

# Opcional: Esto hace que las listas se vean mucho mejor
class CamaAdmin(admin.ModelAdmin):
    list_display = ('codigo_cama', 'servicio', 'estado', 'nivel_cuidado', 'paciente_nombre')
    list_filter = ('estado', 'servicio', 'nivel_cuidado')
    search_fields = ('codigo_cama', 'paciente_nombre')

class ValorIndicadorAdmin(admin.ModelAdmin):
    list_display = ('indicador', 'servicio', 'anio', 'mes', 'valor_calculado')
    list_filter = ('anio', 'mes', 'servicio')

class GestionClinicaAdmin(admin.ModelAdmin):
    list_display = ('servicio', 'anio', 'mes', 'total_egresos')
    list_filter = ('anio', 'mes', 'servicio')

# Registrar los modelos
admin.site.register(Servicio)
admin.site.register(Cama, CamaAdmin)
admin.site.register(Indicador)
admin.site.register(ValorIndicador, ValorIndicadorAdmin)
admin.site.register(GestionClinica, GestionClinicaAdmin)
admin.site.register(ListaEspera)
admin.site.register(Nivel)
admin.site.register(Egreso)
admin.site.register(ServicioGrd)
admin.site.register(OportunidadHospitalizacion)