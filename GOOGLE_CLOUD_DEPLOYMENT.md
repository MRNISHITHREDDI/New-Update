# Google Cloud Deployment Guide for Jalwa Admin Panel

This guide covers the steps to deploy your application to Google Cloud Platform (GCP) and ensure the admin panel works correctly.

## Prerequisites

1. Google Cloud Platform account
2. Google Cloud SDK installed on your local machine
3. Node.js and npm installed

## Step 1: Prepare Your Project for Deployment

Run the deployment script to build the frontend and prepare the server files:

```bash
./deploy.sh
```

This will create a `dist` directory with all the files needed for deployment.

## Step 2: Deploy to Google Cloud App Engine

1. First, authenticate with Google Cloud:

```bash
gcloud auth login
```

2. Set your project ID:

```bash
gcloud config set project YOUR_PROJECT_ID
```

3. Deploy the application:

```bash
gcloud app deploy app.yaml
```

4. Wait for the deployment to complete. Once done, you'll see a URL where your application is deployed.

## Step 3: Environment Variables

Make sure the following environment variables are set in your Google Cloud environment:

- `ADMIN_TOKEN`: The token used for admin API authentication (default: jalwa-admin-2023)

These variables are defined in the `app.yaml` file, but you can also set them in the Google Cloud Console.

## Step 4: Accessing the Admin Panel

To access the admin panel:

1. Visit `https://YOUR-APP-URL/admin`
2. Log in with the admin password: `jalwa-admin-2023`

## Troubleshooting

### Admin Panel Not Working

If the admin panel isn't working after deployment:

1. Check browser developer console for errors
2. Verify that the environment variables are correctly set
3. Try clearing your browser cache and local storage
4. Ensure the server is correctly handling API requests (check server logs)

### API Request Issues

If API requests are failing:

1. Check that your app has the correct permissions
2. Verify that the ADMIN_TOKEN environment variable is set correctly
3. Ensure CORS is properly configured if frontend and backend are on different domains

## Security Considerations

This implementation uses a simple token-based authentication system. For a production environment, consider:

1. Using a more secure authentication method like JWT
2. Storing tokens in a secure environment variable
3. Implementing proper session management
4. Using HTTPS for all communication

## Google Cloud Specific Notes

- App Engine automatically handles https, but you need to ensure the `secure: always` directive is in your app.yaml
- For other GCP services (like Google Cloud Run), you might need different configuration