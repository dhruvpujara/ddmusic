// ...existing code...

// Keep the server alive by pinging every 14 minutes
setInterval(() => {
    fetch('/ping')
        .then(response => console.log('Ping successful'))
        .catch(error => console.error('Ping failed:', error));
}, 14 * 60 * 1000);

// ...existing code...