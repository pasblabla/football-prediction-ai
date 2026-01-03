#!/usr/bin/env python3
"""
Script d'initialisation de la base de données pour Render
Copie la base de données pré-remplie vers le répertoire /tmp
"""
import os
import shutil

def init_database():
    source_db = os.path.join(os.path.dirname(__file__), 'instance', 'site.db')
    target_db = '/tmp/site.db'
    
    if os.path.exists(source_db):
        shutil.copy2(source_db, target_db)
        print(f"✓ Base de données copiée de {source_db} vers {target_db}")
        return True
    else:
        print(f"✗ Fichier source non trouvé: {source_db}")
        return False

if __name__ == '__main__':
    init_database()
