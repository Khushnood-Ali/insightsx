# Create React client package.json
client_package_json = {
    "name": "insightsx-client",
    "version": "2.0.0",
    "private": True,
    "dependencies": {
        "@testing-library/jest-dom": "^5.16.4",
        "@testing-library/react": "^13.3.0",
        "@testing-library/user-event": "^13.5.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1",
        "react-router-dom": "^6.3.0",
        "chart.js": "^4.4.0",
        "react-chartjs-2": "^5.2.0",
        "axios": "^1.5.0",
        "date-fns": "^2.29.3",
        "lucide-react": "^0.263.1",
        "@headlessui/react": "^1.7.17",
        "@heroicons/react": "^2.0.18",
        "tailwindcss": "^3.3.3",
        "autoprefixer": "^10.4.14",
        "postcss": "^8.4.24"
    },
    "scripts": {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject"
    },
    "eslintConfig": {
        "extends": [
            "react-app",
            "react-app/jest"
        ]
    },
    "browserslist": {
        "production": [
            ">0.2%",
            "not dead",
            "not op_mini all"
        ],
        "development": [
            "last 1 chrome version",
            "last 1 firefox version",
            "last 1 safari version"
        ]
    },
    "proxy": "http://localhost:3001"
}

print("Created React client package.json with:")
print("- React 18 with modern hooks")
print("- Chart.js and react-chartjs-2 for visualizations")
print("- TailwindCSS for styling")
print("- Heroicons and Lucide React for icons")
print("- Axios for API calls")
print("- React Router for navigation")

import json
with open('client_package.json', 'w') as f:
    json.dump(client_package_json, f, indent=2)