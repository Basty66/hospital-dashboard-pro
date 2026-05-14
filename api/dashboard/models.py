# dashboard/models.py
from django.db import models

class Servicio(models.Model):
    codigo = models.CharField(max_length=50, unique=True, help_text="Ej: OBS, UCI, UTI")
    nombre = models.CharField(max_length=100, unique=True)
    piso = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class Cama(models.Model):
    ESTADO_CHOICES = [
        ('Disponible', 'Disponible'),
        ('Ocupada', 'Ocupada'),
        ('Bloqueada', 'Bloqueada'),
        ('Limpieza', 'Limpieza'),
    ]
    NIVEL_CHOICES = [
        ('Baja', 'Baja'),
        ('Media', 'Media'),
        ('Alta', 'Alta'),
    ]

    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name='camas')
    codigo_cama = models.CharField(max_length=20, unique=True, help_text="Ej: CAMA-201")
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES)
    nivel_cuidado = models.CharField(max_length=20, choices=NIVEL_CHOICES, blank=True, null=True)
    
    # Datos del paciente
    paciente_nombre = models.CharField(max_length=150, blank=True, null=True)
    paciente_edad = models.IntegerField(blank=True, null=True)
    paciente_peso = models.FloatField(blank=True, null=True)
    
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.codigo_cama} ({self.estado})"

class Indicador(models.Model):
    nombre = models.CharField(max_length=150, unique=True)
    formula = models.TextField(blank=True, null=True)
    unidad = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre

class ValorIndicador(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name='valores_indicadores')
    indicador = models.ForeignKey(Indicador, on_delete=models.CASCADE, related_name='valores')
    anio = models.IntegerField(default=2025)
    mes = models.IntegerField(help_text="0 = Anual, 1 al 12 = Meses exactos")
    valor_calculado = models.FloatField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['servicio', 'indicador', 'anio', 'mes'], 
                name='idx_unico_valor_calculado'
            )
        ]

    def __str__(self):
        return f"{self.indicador.nombre} - {self.servicio.codigo} ({self.mes}/{self.anio})"

class GestionClinica(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name='gestion_clinica')
    anio = models.IntegerField()
    mes = models.IntegerField()
    peso_grd = models.FloatField()
    inliers_pct = models.FloatField()
    outliers_pct = models.FloatField()
    mortalidad_pct = models.FloatField()
    estancias_evitables = models.IntegerField()
    total_egresos = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['servicio', 'anio', 'mes'], 
                name='idx_unico_gestion_clinica'
            )
        ]

class ListaEspera(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.SET_NULL, null=True, blank=True, related_name='listas_espera')
    especialidad = models.CharField(max_length=100)
    tipo_atencion = models.CharField(max_length=50, help_text="Urgencia o Electiva")
    cantidad_pacientes = models.IntegerField()
    dias_espera_promedio = models.IntegerField()
    fecha_corte = models.DateField()


class Nivel(models.Model):
    codigo = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=200)
    tipo = models.CharField(max_length=100, default="General")
    color = models.CharField(max_length=50, default="primary")

    class Meta:
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class Egreso(models.Model):
    nivel = models.ForeignKey(Nivel, on_delete=models.CASCADE, related_name="egresos")
    mes = models.DateField()
    altas = models.IntegerField(default=0)
    traslados = models.IntegerField(default=0)
    fallecidos = models.IntegerField(default=0)
    dias_cama_disponibles = models.IntegerField(default=0)
    dias_cama_ocupados = models.IntegerField(default=0)
    dias_estada = models.IntegerField(default=0)

    class Meta:
        ordering = ["nivel", "mes"]
        unique_together = ["nivel", "mes"]

    def __str__(self):
        return f"{self.nivel.nombre} - {self.mes}"


class ServicioGrd(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name="grd_indicadores")
    anio = models.IntegerField(default=2025)
    egresos = models.IntegerField(default=0)
    pct_egresos = models.FloatField(default=0)
    peso_grd = models.FloatField(default=0)
    inliers_pct = models.FloatField(default=0)
    outliers_pct = models.FloatField(default=0)
    mortalidad_pct = models.FloatField(default=0)
    estada_media = models.FloatField(default=0)
    em_norma = models.FloatField(default=0)
    estada_inliers = models.FloatField(default=0)
    emaf_inlier = models.FloatField(default=0)
    emac_inlier = models.FloatField(default=0)
    iema_inlier = models.FloatField(default=0)
    if_inlier = models.FloatField(default=0)
    ic_inlier = models.FloatField(default=0)
    estancias_evitables = models.FloatField(default=0)
    estada_outliers = models.FloatField(default=0)
    outliers_stay_pct = models.FloatField(default=0)

    class Meta:
        unique_together = ["servicio", "anio"]

    def __str__(self):
        return f"GRD {self.servicio.codigo} - {self.anio}"


class OportunidadHospitalizacion(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name="oportunidad_hospitalizacion", null=True, blank=True)
    year = models.IntegerField()
    month = models.IntegerField()
    p1 = models.IntegerField()
    p2 = models.IntegerField()

    class Meta:
        unique_together = ["year", "month"]

    def __str__(self):
        return f"Oportunidad {self.year}-{self.month:02d}"