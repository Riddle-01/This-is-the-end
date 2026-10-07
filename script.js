

document.addEventListener("DOMContentLoaded", function () {

    const menuToggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("nav");

    if (menuToggle && nav) {
        menuToggle.addEventListener("click", function () {
            nav.classList.toggle("active");
        });
    }



    const slides = document.querySelectorAll(".slide");
    const nextButton = document.querySelector(".next");
    const prevButton = document.querySelector(".prev");
    const indicators = document.querySelectorAll(".indicator");

    let currentSlide = 0;
    let carouselInterval;


    function showSlide(index) {

        if (slides.length === 0) return;

        // Evitar que el número salga del rango
        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }

        // Ocultar todas las imágenes
        slides.forEach(function (slide) {
            slide.classList.remove("active");
        });

        // Mostrar la imagen actual
        slides[currentSlide].classList.add("active");


        // Actualizar indicadores
        indicators.forEach(function (indicator, index) {
            indicator.classList.remove("active");

            if (index === currentSlide) {
                indicator.classList.add("active");
            }
        });
    }


    // Botón siguiente
    if (nextButton) {
        nextButton.addEventListener("click", function () {
            showSlide(currentSlide + 1);
            restartCarousel();
        });
    }


    // Botón anterior
    if (prevButton) {
        prevButton.addEventListener("click", function () {
            showSlide(currentSlide - 1);
            restartCarousel();
        });
    }


    // Indicadores del carrusel
    indicators.forEach(function (indicator, index) {

        indicator.addEventListener("click", function () {
            showSlide(index);
            restartCarousel();
        });

    });


    // Cambio automático
    function startCarousel() {

        if (slides.length > 1) {

            carouselInterval = setInterval(function () {
                showSlide(currentSlide + 1);
            }, 5000);

        }
    }


    // Reiniciar temporizador
    function restartCarousel() {

        clearInterval(carouselInterval);
        startCarousel();

    }


    // Iniciar carrusel
    showSlide(0);
    startCarousel();

    const carousel = document.querySelector(".carousel");

    if (carousel) {

        carousel.addEventListener("mouseenter", function () {
            clearInterval(carouselInterval);
        });

        carousel.addEventListener("mouseleave", function () {
            startCarousel();
        });

    }


    const menuLinks = document.querySelectorAll('a[href^="#"]');

    menuLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = this.getAttribute("href");

            if (targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                // Cerrar menú móvil
                if (nav) {
                    nav.classList.remove("active");
                }

            }

        });

    });

    const animatedElements = document.querySelectorAll(
        ".statistic, .profile, .card, .section, .feature"
    );


    const observer = new IntersectionObserver(
        function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    entry.target.classList.add("show");

                    observer.unobserve(entry.target);

                }

            });

        },
        {
            threshold: 0.15
        }
    );


    animatedElements.forEach(function (element) {
        observer.observe(element);
    });

    const statistics = document.querySelectorAll(".statistic strong");


    statistics.forEach(function (statistic) {

        const finalValue = statistic.textContent.trim();

        // Buscar solamente números
        const number = parseInt(finalValue.replace(/\D/g, ""));

        if (!isNaN(number)) {

            statistic.textContent = "0";

            let currentValue = 0;
            const duration = 1500;
            const increment = number / (duration / 20);

            const counter = setInterval(function () {

                currentValue += increment;

                if (currentValue >= number) {

                    currentValue = number;
                    clearInterval(counter);

                }

                statistic.textContent =
                    Math.floor(currentValue) +
                    finalValue.replace(/[0-9]/g, "");

            }, 20);

        }

    });


    const backToTop = document.querySelector(".back-to-top");


    if (backToTop) {

        window.addEventListener("scroll", function () {

            if (window.scrollY > 500) {

                backToTop.classList.add("show");

            } else {

                backToTop.classList.remove("show");

            }

        });


        backToTop.addEventListener("click", function () {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });

    }

    const header = document.querySelector("header");


    if (header) {

        window.addEventListener("scroll", function () {

            if (window.scrollY > 50) {

                header.classList.add("scrolled");

            } else {

                header.classList.remove("scrolled");

            }

        });

    }



    const galleryImages = document.querySelectorAll(".gallery img");


    galleryImages.forEach(function (image) {

        image.addEventListener("click", function () {

            this.classList.toggle("selected");

        });

    });

    document.body.classList.add("loaded");

});