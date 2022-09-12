# Webhook forwarder

Various services use webhooks to deliver data to applications. Webhook data is usually sent to HTTP API endpoints.

To receive webhooks, each API endpoint must be registered in the service's configuration. When the same service instance
is used for several test environments problems arise. The service may limit maximum number of webhook receivers.
Moreover, it could be difficult to manually manage list of endpoints, especially when addresses change often.

The aim of this app is to simplify webhook delivery and management. It provides a single receiver of webhooks that
forwards webhook events to all receivers discovered in the Kubernetes cluster. List of receivers is periodically
refreshed, which makes the app suitable for use with temporary preview environments.

Current version of the app has been tested with [Stripe](https://stripe.com/docs) and assumes that services that should
receive webhooks are defined as services with common name, possibly in different namespaces. However, the app can be
easily
adjusted for other services and deployment configurations.

# Deployment

1. Clone this repository
2. Copy `k8s/webhook-forwarder-user-config.dist.yaml` to `k8s/webhook-forwarder-user-config.yaml` and fill fields marked
   with `TODO`. See **[Configuration](README.md#configuration)** section for more details
3. Use `kustomize` to generate final config (`kustomize build ./k8s`)
4. Apply the configuration to your Kubernetes cluster
5. Define any additional policies required by your cluster

## Configuration

Work in progress

| Environmental variable name   | Description | Example |
|-------------------------------|-------------|---------|
| HEADERS_TO_FORWARD            |             |         |
| TARGET_SERVICE_NAME           |             |         |
| WEBHOOK_DESTINATION_ENDPOINT  |             |         |
| IGNORE_DESTINATION_SSL_ERRORS |             |         |
| STATIC_CLIENT_MODE            |             |         |
| STATIC_CLIENT                 |             |         |

# Building & running

- App is designed to run on Docker
- It can be also started locally:
    - First install dependencies `npm install`
    - Then build `npm run build` and start `node dist/app.js`
    - Or run in development mode `npm run dev`

# Running tests

```sh
npm install
npm test
```
