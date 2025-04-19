pipeline {
    agent any

    tools {
        nodejs 'Node18'
    }

    environment {
        NEXT_PUBLIC_MASTER_URL_KEY = credentials('NEXT_PUBLIC_MASTER_URL_KEY')
        DESCOPE_CLIENT_ID = credentials('DESCOPE_CLIENT_ID')
        DESCOPE_CLIENT_SECRET = credentials('DESCOPE_CLIENT_SECRET')
        // Add more memory for Next.js build
        NODE_OPTIONS = '--max_old_space_size=4096'
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
                // Clear cache and build
                sh 'rm -rf .next'
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    try {
                        // Install Docker in Jenkins container
                        sh '''
                            apt-get update
                            apt-get install -y docker.io
                            service docker start
                        '''
                        sh 'docker build -f Dockerfile.dev -t fixitnow-app .'
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