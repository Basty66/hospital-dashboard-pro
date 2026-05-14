import json
from datetime import datetime
from django.core.management.base import BaseCommand
from dashboard.models import Nivel, Egreso


class Command(BaseCommand):
    help = "Importa datos REM desde un archivo JSON (formato rem.json)"

    def add_arguments(self, parser):
        parser.add_argument("json_path", type=str, help="Ruta al archivo rem.json")

    def handle(self, *args, **options):
        path = options["json_path"]
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        for item in data["niveles"]:
            nivel, created = Nivel.objects.get_or_create(
                codigo=item["codigo"],
                defaults={
                    "nombre": item["nombre"],
                    "tipo": item["nivel_cuidado"]["tipo"],
                    "color": item["nivel_cuidado"]["color"],
                },
            )
            if created:
                self.stdout.write(f"  + Nivel: {nivel.nombre}")

            for eg in item["egresos"]:
                anio, mes = eg["mes"].split("-")
                Egreso.objects.update_or_create(
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

        total_niveles = Nivel.objects.count()
        total_egresos = Egreso.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"Importacion completada: {total_niveles} niveles, {total_egresos} egresos"
        ))
