# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_ML_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ML_BASE_URL=$VITE_ML_BASE_URL

# Build the Vite application
RUN npm run build

# Serve stage (Using Nginx)
FROM nginx:alpine
# Copy the compiled React app
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration for single-page applications (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
