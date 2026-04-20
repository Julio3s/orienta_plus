import importlib.util
from pathlib import Path

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Charge les filières, séries, matières et universités de démonstration (production / staging).'

    def handle(self, *args, **options):
        backend_root = Path(__file__).resolve().parents[3]
        script_path = backend_root / 'scripts' / 'insert_example_data.py'
        if not script_path.is_file():
            script_path = backend_root.parent / 'scripts' / 'insert_example_data.py'
        if not script_path.is_file():
            self.stderr.write(f'Script introuvable (essayé {script_path}).')
            return

        spec = importlib.util.spec_from_file_location('insert_example_data', script_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        module.main()
        self.stdout.write(self.style.SUCCESS('Données de démo importées.'))
