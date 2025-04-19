pipeline {
    agent any

    tools {
        nodejs 'Node18'
    }

    environment {
        DOCKER_IMAGE = 'fixitnow-app'
        DOCKER_TAG = 'latest'
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

        stage('Run Tests') {
            steps {
                sh 'npm test'
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
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    try {
                        sh "docker stop ${DOCKER_IMAGE}"
                        sh "docker rm ${DOCKER_IMAGE}"
                    } catch (err) {
                        echo "Container not found, proceeding..."
                    }
                    sh "docker run -d -p 3000:3000 --name ${DOCKER_IMAGE} ${DOCKER_IMAGE}:${DOCKER_TAG}"
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