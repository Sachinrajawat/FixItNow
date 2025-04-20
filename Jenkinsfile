pipeline {
    agent any

    environment {
        REPO_URL = 'https://github.com/Sachinrajawat/FixItNow.git'
        PROJECT_NAME = 'FixItNow'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Clone Repository') {
            steps {
                bat "git clone $REPO_URL"
            }
        }

        stage('Build Docker Images') {
            steps {
                dir("${PROJECT_NAME}") {
                    bat 'docker-compose build'
                }
            }
        }

        stage('Start Containers') {
            steps {
                dir("${PROJECT_NAME}") {
                    bat 'docker-compose up -d'
                }
            }
        }

        stage('Verify Running Containers') {
            steps {
                bat 'docker ps -a'
            }
        }
    }

    post {
        success {
            mail to: 'sachinrajawat835@gmail.com',
                 subject: "✅ Build Success - #${env.BUILD_NUMBER}",
                 body: "Your Jenkins pipeline ran successfully!"
        }
        failure {
            mail to: 'sachinrajawat835@gmail.com',
                 subject: "❌ Build Failed - #${env.BUILD_NUMBER}",
                 body: "Pipeline failed. Please check Jenkins logs."
        }
    }
}
