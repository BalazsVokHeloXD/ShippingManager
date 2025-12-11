# Shipping Manager Repository

> **Backend folder** contains all source code realted to the services. Also includes the Dockerfiles that are needed for the containerization and a proxy.js file that was used for easier local tests.

> **Frontend folder** contains the different components that build the website for Shipping Manager.

> **Database folder** contains the structure of the MySQL databse.

> **Kubernetes-config folder** holds every configuration .yaml file that is needed to set up the system in Kubernetes. From loadbalancer and ingress-controller setup to service deployments.

#### Created service and frontend images are linked to this repository:
* shippingmanager-userservice
* shippingmanager-reservationservice
* shippingmanager-paymentservice
* shippingmanager-adminservice
* shippingmanager-consumerservice
* shippingmanager-frontend