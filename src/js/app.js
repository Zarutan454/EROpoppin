// Create Vue Application
const app = Vue.createApp({
    data() {
        return {
            showAgeVerification: true,
            showLoginModal: false,
            showMobileMenu: false,
            loginForm: {
                email: '',
                password: ''
            },
            contactForm: {
                name: '',
                email: '',
                message: ''
            },
            featuredModels: [
                {
                    id: 1,
                    name: 'Sophia',
                    age: 23,
                    location: 'München',
                    image: 'https://example.com/images/model1.jpg', // Placeholder
                    languages: ['Deutsch', 'Englisch', 'Französisch'],
                    height: '175cm',
                    measurements: '90-60-90',
                    isVip: true,
                    rate: '300€/h'
                },
                {
                    id: 2,
                    name: 'Isabella',
                    age: 25,
                    location: 'Hamburg',
                    image: 'https://example.com/images/model2.jpg', // Placeholder
                    languages: ['Deutsch', 'Englisch', 'Italienisch'],
                    height: '170cm',
                    measurements: '85-58-87',
                    isVip: true,
                    rate: '350€/h'
                },
                // Add more models as needed
            ],
            services: [
                {
                    id: 1,
                    title: 'VIP Dinner Date',
                    description: 'Elegante Begleitung für geschäftliche oder private Dinner-Events.',
                    icon: 'mdi mdi-food-fork-drink'
                },
                {
                    id: 2,
                    title: 'Event Begleitung',
                    description: 'Professionelle Begleitung für Galas, Vernissagen oder Business-Events.',
                    icon: 'mdi mdi-ticket-confirmation'
                },
                {
                    id: 3,
                    title: 'Reisebegleitung',
                    description: 'Diskrete Begleitung für Geschäftsreisen oder Urlaub.',
                    icon: 'mdi mdi-airplane'
                }
            ],
            locations: [
                {
                    id: 1,
                    city: 'München',
                    image: 'https://example.com/images/munich.jpg' // Placeholder
                },
                {
                    id: 2,
                    city: 'Hamburg',
                    image: 'https://example.com/images/hamburg.jpg' // Placeholder
                },
                {
                    id: 3,
                    city: 'Berlin',
                    image: 'https://example.com/images/berlin.jpg' // Placeholder
                },
                {
                    id: 4,
                    city: 'Frankfurt',
                    image: 'https://example.com/images/frankfurt.jpg' // Placeholder
                }
            ]
        }
    },
    methods: {
        verifyAge(isOver18) {
            if (isOver18) {
                this.showAgeVerification = false;
                localStorage.setItem('ageVerified', 'true');
            } else {
                window.location.href = 'https://www.google.com';
            }
        },
        async login() {
            try {
                // Implement login logic here
                const response = await axios.post('/api/login', this.loginForm);
                if (response.data.success) {
                    this.showLoginModal = false;
                    // Handle successful login
                }
            } catch (error) {
                console.error('Login failed:', error);
                // Handle login error
            }
        },
        showModelDetails(model) {
            // Implement model details modal logic
        },
        async submitContact() {
            try {
                // Implement contact form submission logic
                const response = await axios.post('/api/contact', this.contactForm);
                if (response.data.success) {
                    // Handle successful submission
                    this.contactForm = {
                        name: '',
                        email: '',
                        message: ''
                    };
                }
            } catch (error) {
                console.error('Contact form submission failed:', error);
                // Handle submission error
            }
        },
        toggleMobileMenu() {
            this.showMobileMenu = !this.showMobileMenu;
        }
    },
    mounted() {
        // Check age verification on mount
        const ageVerified = localStorage.getItem('ageVerified');
        if (ageVerified === 'true') {
            this.showAgeVerification = false;
        }

        // Add scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        });

        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });
    }
});

// Mount Vue application
app.mount('#app');

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

// Image Lazy Loading
document.addEventListener('DOMContentLoaded', function() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
});

// Security Features
document.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable right-click
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && 
        (e.keyCode === 67 || // C key
         e.keyCode === 86 || // V key
         e.keyCode === 85 || // U key
         e.keyCode === 117)) { // F6 key
        e.preventDefault();
        return false;
    }
});

// Mobile Detection
const isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

// Adjust UI for mobile devices
if (isMobile.any()) {
    document.body.classList.add('is-mobile');
}

// Analytics Tracking (placeholder)
function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}