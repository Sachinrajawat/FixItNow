pipeline {
    agent any

    tools {
        nodejs 'Node18'
    }

    environment {
        NEXT_PUBLIC_MASTER_URL_KEY = credentials('NEXT_PUBLIC_MASTER_URL_KEY')
        DESCOPE_CLIENT_ID = credentials('DESCOPE_CLIENT_ID')
        DESCOPE_CLIENT_SECRET = credentials('DESCOPE_CLIENT_SECRET')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    try {
                        sh 'docker build -t fixitnow-app .'
                        sh 'docker run -d -p 3000:3000 --name fixitnow fixitnow-app'
                    } catch (err) {
                        echo "Docker build failed: ${err}"
                        throw err
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}