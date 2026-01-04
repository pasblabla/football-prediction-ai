"""
Module pour charger les données initiales compressées
"""
import gzip
import json
import os

def load_initial_data():
    """Charge les données initiales depuis le fichier compressé"""
    gz_file = os.path.join(os.path.dirname(__file__), 'initial_data.py.gz')
    
    if not os.path.exists(gz_file):
        return None
    
    try:
        with gzip.open(gz_file, 'rt') as f:
            content = f.read()
            # Extraire le dictionnaire JSON du contenu Python
            # Format: INITIAL_DATA = {...}
            start = content.find('{')
            end = content.rfind('}') + 1
            json_str = content[start:end]
            return json.loads(json_str)
    except Exception as e:
        print(f"Erreur lors du chargement des données compressées: {e}")
        return None

if __name__ == '__main__':
    data = load_initial_data()
    if data:
        print(f"✓ Données chargées:")
        print(f"  - Ligues: {len(data.get('leagues', []))}")
        print(f"  - Équipes: {len(data.get('teams', []))}")
        print(f"  - Matchs: {len(data.get('matches', []))}")
        print(f"  - Prédictions: {len(data.get('predictions', []))}")
    else:
        print("✗ Impossible de charger les données")
