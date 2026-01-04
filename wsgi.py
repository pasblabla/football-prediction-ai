from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_apscheduler import APScheduler
from src.football_new import football_bp
from src.models.football import db
import logging

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialisation de l'application Flask
app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# Configuration
# Utiliser SQLite par défaut (plus stable sur Render free tier)
import os
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
        from src.models.football import League, Team, Match, Prediction
        if League.query.count() == 0:
            logger.info("[DATABASE] Chargement des données initiales...")
            try:
                from initial_data import INITIAL_DATA
                
                # Charger les ligues
                for league_data in INITIAL_DATA.get('leagues', []):
                    if not League.query.filter_by(id=league_data['id']).first():
                        league = League(**league_data)
                        db.session.add(league)
                db.session.commit()
                logger.info(f"[DATABASE] {len(INITIAL_DATA.get('leagues', []))} ligues chargées")
                
                # Charger les équipes
                for team_data in INITIAL_DATA.get('teams', []):
                    if not Team.query.filter_by(id=team_data['id']).first():
                        team = Team(**team_data)
                        db.session.add(team)
                db.session.commit()
                logger.info(f"[DATABASE] {len(INITIAL_DATA.get('teams', []))} équipes chargées")
                
                # Charger les matchs
                for match_data in INITIAL_DATA.get('matches', []):
                    if not Match.query.filter_by(id=match_data['id']).first():
                        match = Match(**match_data)
                        db.session.add(match)
                db.session.commit()
                logger.info(f"[DATABASE] {len(INITIAL_DATA.get('matches', []))} matchs chargés")
                
                # Charger les prédictions
                for pred_data in INITIAL_DATA.get('predictions', []):
                    if not Prediction.query.filter_by(id=pred_data['id']).first():
                        pred = Prediction(**pred_data)
                        db.session.add(pred)
                db.session.commit()
                logger.info(f"[DATABASE] {len(INITIAL_DATA.get('predictions', []))} prédictions chargées")
            except Exception as e:
                logger.error(f"[DATABASE] Erreur chargement données: {e}")
                db.session.rollback()
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
