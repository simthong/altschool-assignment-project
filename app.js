const header = document.querySelector('.site-header');
const progressBar = document.querySelector('.scroll-progress');
const revealElements = document.querySelectorAll('.reveal');
const counters = document.querySelectorAll('.data-item h5[data-target]');
const parallaxItems = document.querySelectorAll('.parallax-target');
const buttons = document.querySelectorAll('.interactive-btn');

const setScrollEffects = () => {
    const scrollTop = window.scrollY;
    const maxHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxHeight > 0 ? (scrollTop / maxHeight) * 100 : 0;

    progressBar.style.width = `${progress}%`;
    header.classList.toggle('scrolled', scrollTop > 20);
};

const revealOnScroll = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealOnScroll.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2
});

revealElements.forEach((item) => revealOnScroll.observe(item));

const animateCounter = (counter) => {
    const end = Number(counter.dataset.target);
    const suffix = counter.dataset.suffix || '';
    const duration = 1200;
    const startTime = performance.now();

    const frame = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = end * eased;

        counter.textContent = `${Math.floor(current)}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            counter.textContent = `${end}${suffix}`;
        }
    };

    requestAnimationFrame(frame);
};

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.6
});

counters.forEach((counter) => counterObserver.observe(counter));

window.addEventListener('mousemove', (event) => {
    const xPosition = (event.clientX / window.innerWidth - 0.5) * 10;
    const yPosition = (event.clientY / window.innerHeight - 0.5) * 10;

    parallaxItems.forEach((item, index) => {
        const depth = index + 1;
        item.style.transform = `translate3d(${xPosition / depth}px, ${yPosition / depth}px, 0)`;
    });
});

buttons.forEach((button) => {
    button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - rect.width / 2;
        const offsetY = event.clientY - rect.top - rect.height / 2;

        button.style.transform = `translate(${offsetX * 0.08}px, ${offsetY * 0.08}px)`;
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = '';
    });
});

window.addEventListener('scroll', setScrollEffects);
setScrollEffects();
