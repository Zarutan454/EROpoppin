// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Add fade-in animation to main content
    const mainContent = document.querySelector('main');
    mainContent.classList.add('fade-in');

    // Add hover effects to cards
    const cards = document.querySelectorAll('.bg-white.shadow');
    cards.forEach(card => {
        card.classList.add('hover-scale', 'card-shadow');
    });

    // Initialize tooltips
    initializeTooltips();

    // Setup notification system
    setupNotifications();

    // Add loading states to charts
    setupCharts();
}

function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.classList.add('tooltip');
    });
}

function setupNotifications() {
    const notificationButton = document.querySelector('.mdi-bell').parentElement;
    const badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.textContent = '3'; // Example notification count
    notificationButton.appendChild(badge);

    notificationButton.addEventListener('click', () => {
        // Example notification click handler
        console.log('Notifications clicked');
    });
}

function setupCharts() {
    // Simulate loading charts
    const chartContainers = document.querySelectorAll('.bg-gray-50');
    chartContainers.forEach(container => {
        container.classList.add('loading');
        setTimeout(() => {
            container.classList.remove('loading');
            renderChart(container);
        }, 1500);
    });
}

function renderChart(container) {
    // Example chart data
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [30, 45, 35, 50, 40, 60]
    };

    // Clear loading message
    container.innerHTML = '';

    // Create canvas
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Draw simple chart (this is just a placeholder)
    const ctx = canvas.getContext('2d');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Draw chart background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Draw chart line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    const stepX = width / (data.labels.length - 1);
    const maxValue = Math.max(...data.values);
    const scaleY = (height - 40) / maxValue;

    data.values.forEach((value, index) => {
        const x = index * stepX;
        const y = height - (value * scaleY) - 20;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw points
    data.values.forEach((value, index) => {
        const x = index * stepX;
        const y = height - (value * scaleY) - 20;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    data.labels.forEach((label, index) => {
        const x = index * stepX;
        ctx.fillText(label, x - 10, height - 5);
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    const chartContainers = document.querySelectorAll('.bg-gray-50');
    chartContainers.forEach(container => {
        container.innerHTML = '';
        renderChart(container);
    });
});