from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_apscheduler import APScheduler
from src.football_new import football_bp
from src.models.football import db
import logging
import os
import sqlite3

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialisation de l'application Flask
app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# Configuration
# Utiliser SQLite par défaut (plus stable sur Render free tier)
db_url = os.getenv('DATABASE_URL')
if db_url:
    # Convertir postgresql:// en postgresql+psycopg2:// pour SQLAlchemy
    if db_url.startswith('postgresql://'):
        db_url = db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
else:
    # Utiliser SQLite en local et en production (plus stable)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'super-secret-key')

# Configuration APScheduler
app.config['SCHEDULER_API_ENABLED'] = True
app.config['SCHEDULER_TIMEZONE'] = 'Europe/Paris'

# Initialiser la base de données
db.init_app(app)

# Créer les tables automatiquement au démarrage
with app.app_context():
    try:
        db.create_all()
        logger.info("[DATABASE] Tables créées ou déjà existantes")
        
        # Charger les données initiales si la base est vide
        from src.models.football import League
        if League.query.count() == 0:
            logger.info("[DATABASE] Chargement des données initiales...")
            try:
                # Extraire le chemin de la base de données
                db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
                
                # Charger les données directement avec SQLite
                sql_file = os.path.join(os.path.dirname(__file__), 'init_database.sql')
                if os.path.exists(sql_file):
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    
                    with open(sql_file, 'r') as f:
                        sql_content = f.read()
                    
                    # Exécuter chaque statement SQL
                    statement_count = 0
                    for statement in sql_content.split('\n'):
                        statement = statement.strip()
                        if statement and not statement.startswith('--'):
                            try:
                                cursor.execute(statement)
                                statement_count += 1
                            except sqlite3.IntegrityError:
                                # Ignorer les erreurs de clé primaire
                                pass
                            except Exception as e:
                                logger.debug(f"Erreur SQL: {e}")
                    
                    conn.commit()
                    conn.close()
                    
                    logger.info(f"[DATABASE] {statement_count} statements SQL exécutés")
                    
                    # Vérifier le nombre de ligues chargées
                    league_count = League.query.count()
                    logger.info(f"[DATABASE] Données chargées: {league_count} ligues")
                else:
                    logger.warning("[DATABASE] Fichier SQL non trouvé")
            except Exception as e:
                logger.error(f"[DATABASE] Erreur chargement données: {e}")
    except Exception as e:
        logger.error(f"[DATABASE] Erreur: {e}")

# Initialiser le scheduler
scheduler = APScheduler()
scheduler.init_app(app)

# Démarrer le scheduler automatiquement (pour gunicorn et autres WSGI servers)
# Utiliser un flag pour éviter le double démarrage
if not scheduler.running:
    scheduler.start()
    logger.info("[SCHEDULER] APScheduler démarré automatiquement")

# Enregistrement du Blueprint principal
app.register_blueprint(football_bp, url_prefix='/api/football')

# Route pour servir l'interface web
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Route pour servir les fichiers statiques
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

# Route pour l'API du scheduler
@app.route('/api/scheduler/status', methods=['GET'])
def scheduler_status():
    try:
        jobs = scheduler.get_jobs()
        return jsonify({
            'running': scheduler.running,
            'jobs': [
                {
                    'id': job.id,
                    'name': job.name,
                    'next_run_time': str(job.next_run_time) if job.next_run_time else None
                }
                for job in jobs
            ]
        })
    except Exception as e:
        logger.error(f"[SCHEDULER] Erreur: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scheduler/run-now', methods=['POST'])
def run_scheduler_now():
    try:
        from src.scheduler.tasks import run_all_tasks
        run_all_tasks()
        return jsonify({'status': 'success', 'message': 'Tâches exécutées'})
    except Exception as e:
        logger.error(f"[SCHEDULER] Erreur: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
