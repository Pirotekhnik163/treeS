// Очищаем якорь из URL при загрузке страницы
window.addEventListener('load', function() {
    if (window.location.hash) {
        // Убираем якорь из URL без перезагрузки
        history.replaceState(null, null, ' ');
        
        // Дополнительно прокручиваем наверх
        window.scrollTo(0, 0);
    }
});



// Добавьте в script.js штука крепит картинки и не даёт копировать 
document.querySelectorAll('img').forEach(img => {
    img.style.pointerEvents = 'none';
    img.setAttribute('draggable', 'false');
});



// Управление второй шапкой
function handleFixedHeader() {
    const mainHeader = document.querySelector('.header:not(.header--fixed)');
    const fixedHeader = document.querySelector('.header--fixed');
    const scrollThreshold = 100; // Когда основная шапка скрывается
    
    if (!mainHeader || !fixedHeader) return;
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        
        if (scrolled > scrollThreshold) {
            fixedHeader.classList.add('header--visible');
        } else {
            fixedHeader.classList.remove('header--visible');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM полностью загружен. Инициализация скрипта...");

    // Получаем форму по её ID. Теперь это надежно, так как мы добавили ID.
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) {
        console.error("Ошибка: Элемент формы с ID 'contactForm' не найден.");
        return;
    }
    console.log("Форма найдена:", contactForm);

    const responseMessageDiv = document.getElementById('responseMessage');
    if (!responseMessageDiv) {
        console.warn("Предупреждение: Элемент для вывода сообщений с ID 'responseMessage' не найден. Создаю его.");
        const newDiv = document.createElement('div');
        newDiv.id = 'responseMessage';
        contactForm.parentNode.insertBefore(newDiv, contactForm.nextSibling); // Вставляем после формы
    }
    
    contactForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Отменяем стандартное поведение отправки формы
        console.log("Событие submit формы перехвачено. Начинаю обработку...");

        // --- Получаем ссылки на элементы формы ---
        // Используем атрибут 'name' для более надежного доступа к полям формы
        const nameInput = contactForm.querySelector('[name="name"]');
        const emailInput = contactForm.querySelector('[name="email"]');
        const phoneInput = contactForm.querySelector('[name="phone"]');
        const agreementCheckbox = contactForm.querySelector('[name="agreement"]');

        // --- Извлекаем значения полей ---
        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const agreement = agreementCheckbox ? agreementCheckbox.checked : false;

        console.log(`Извлеченные данные: Имя='${name}', Email='${email}', Телефон='${phone}', Согласие=${agreement}`);

        // --- Валидация ---
        let errors = [];

        if (name === '') {
            errors.push("Пожалуйста, введите ваше имя.");
        }
        if (email === '') {
            errors.push("Пожалуйста, введите ваш Email.");
        } else if (!validateEmail(email)) {
            errors.push("Некорректный формат Email.");
        }
        if (phone === '') {
            errors.push("Пожалуйста, введите ваш телефон.");
        }
        if (!agreement) {
            errors.push("Вы должны согласиться на обработку персональных данных.");
        }

        responseMessageDiv.innerHTML = ''; // Очищаем предыдущие сообщения

        if (errors.length > 0) {
            console.warn("Обнаружены ошибки валидации:", errors);
            let errorHtml = '<p class="error"><b>Ошибки:</b></p>';
            errors.forEach(error => {
                errorHtml += `<p class="error">- ${error}</p>`;
            });
            responseMessageDiv.innerHTML = errorHtml;
            return; // Прерываем отправку, если есть ошибки
        }

        // --- Формируем данные для отправки ---
        const formData = {
            name: name,
            email: email,
            phone: phone,
            
        };

        const backendUrl = 'https://backendtrees-production.up.railway.app'; 
        console.log(`Попытка отправки данных на URL: ${backendUrl} методом POST.`);
        console.log("Отправляемые данные (JSON):", formData);

        try {
            const response = await fetch(`https://backendtrees-production.up.railway.app/feedback/create`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log("Получен ответ от сервера.");
            console.log("HTTP Статус:", response.status, " (response.ok:", response.ok, ")");
            console.log("HTTP Заголовки ответа:", Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let errorMessage = `Ошибка HTTP-запроса! Статус: ${response.status} (${response.statusText})`;
                try {
                    const errorData = await response.json();
                    console.error("Сервер вернул ошибку в формате JSON:", errorData);
                    errorMessage = errorData.message || errorMessage; // Используем сообщение от сервера, если есть
                } catch (e) {
                    // Если ответ не JSON, просто логируем текст
                    const rawErrorText = await response.text();
                    console.error("Сервер вернул ошибку, но ответ не является JSON. Сырой текст ответа:", rawErrorText);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json(); // Парсим JSON ответ от сервера
            console.log("Успешный JSON-ответ от сервера:", result);

            if (response.status === 201 && result.id) {
                responseMessageDiv.innerHTML = `<p class="success">${result.message || 'Ваши данные успешно отправлены!'}</p>`;
                contactForm.reset(); // Очищаем форму после успешной отправки
                console.log("Форма успешно отправлена и очищена. Сервер вернул успех.");
            } else {
                responseMessageDiv.innerHTML = `<p class="error">${result.message || 'Произошла ошибка на сервере.'}</p>`;
                console.warn("Сервер вернул статус ошибки 'error':", result.message);
            }

        } catch (error) {
            console.error('Критическая ошибка при выполнении fetch-запроса или обработке ответа:', error.message, error);
            responseMessageDiv.innerHTML = `<p class="error">Произошла ошибка при отправке данных: ${error.message}</p>`;
        }
    });

    // --- Функция валидации Email ---
    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
});

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', handleFixedHeader);














// Плавная версия для партнёров избегающие лого 
document.querySelectorAll('.partner-item').forEach(item => {
    let animationFrame;
    
    item.addEventListener('mousemove', function(e) {
        // Отменяем предыдущий кадр анимации для плавности
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        
        animationFrame = requestAnimationFrame(() => {
            const rect = this.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            // Более мягкое смещение
            const distanceX = ((mouseX - centerX) / rect.width) * 50;
            const distanceY = ((mouseY - centerY) / rect.height) * 50;
            const rotate = ((mouseX - centerX) / rect.width) * 12;
            
            this.style.transform = `translate(${-distanceX}px, ${-distanceY}px) rotate(${rotate}deg)`;
        });
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'translate(0, 0) rotate(0deg)';
    });
});


// Эффект масштабирования для фоновой картинки формы -бэк формы для заполнения 
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const contactsForm = document.querySelector('.contacts-form');
    const bgImage = document.querySelector('.contacts-bg-image');
    
    if (contactsForm && bgImage) {
        const formTop = contactsForm.offsetTop;
        const formHeight = contactsForm.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Когда форма в поле зрения
        if (scrolled + viewportHeight > formTop && scrolled < formTop + formHeight) {
            const progress = (scrolled - formTop + viewportHeight) / (formHeight + viewportHeight);
            
            // Масштаб от 0.8 до 1.2 (настройте под себя)
            const scale = 0.7 + (progress * 0.4);
            
            bgImage.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }
});




//анимация пунктов как это работает
function lowerZoneStepAnimation() {
    const steps = document.querySelectorAll('.step-cont');
    const viewportHeight = window.innerHeight;
    const scrolled = window.pageYOffset;
    
    // Более низкая зона активации (65%-85% экрана)
    const activationStart = scrolled + viewportHeight * 0.65;
    const activationEnd = scrolled + viewportHeight * 0.85;
    const activationRange = activationEnd - activationStart;
    
    steps.forEach((step, index) => {
        const stepTop = step.offsetTop;
        const stepHeight = step.offsetHeight;
        const stepCenter = stepTop + stepHeight / 2;
        
        let progress = 0;
        
        // Если центр шага в зоне активации
        if (stepCenter >= activationStart && stepCenter <= activationEnd) {
            // ИНВЕРТИРУЕМ: чем ближе к верху зоны, тем больше прогресс
            progress = 1 - ((stepCenter - activationStart) / activationRange);
        }
        // Если выше зоны активации - полная анимация
        else if (stepCenter < activationStart) {
            progress = 1;
        }
        // Если ниже зоны активации - не анимируем
        else {
            progress = 0;
        }
        
        // Задержка для очередности
        const delayedProgress = Math.max(0, progress - (index * 0.2));
        
        const scale = 0.95 + (delayedProgress * 0.1);
        
        step.style.transform = `scale(${scale})`;
    });
    
    requestAnimationFrame(lowerZoneStepAnimation);
}
lowerZoneStepAnimation();















// Параллакс эффект для hero
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const speed = 0.5; // Скорость движения (меньше = медленнее)
    
    if (hero && scrolled < hero.offsetHeight) {
        const yPos = -(scrolled * speed);
        hero.style.backgroundPosition = `center ${yPos}px`;
    }
});

// Простой параллакс с фиксацией на matrix(1, 0, 0, 1, 0, -102.8)
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const emotionalBlock = document.querySelector('.emotional-block');
    
    if (emotionalBlock) {
        const blockTop = emotionalBlock.offsetTop;
        
        // Фиксированное значение для остановки
        const stopValue = -102.8;
        
        const bgImages = document.querySelectorAll('.bg-image-1, .bg-image-2, .bg-image-3');
        
        bgImages.forEach(img => {
            let yPos;
            
            // Если прокрутили достаточно - фиксируем значение
            if (scrolled > blockTop + 500) { // Настройте 500 под нужную точку
                yPos = stopValue;
            } else {
                // Обычный параллакс до точки фиксации
                const relativeScroll = scrolled - blockTop;
                const speed = 0.3; // Настройте скорость
                yPos = -(relativeScroll * speed);
                
                // Не даем уйти дальше stopValue
                if (yPos < stopValue) {
                    yPos = stopValue;
                }
            }
            
            // Применяем transform
            let transform = `matrix(1, 0, 0, 1, 0, ${yPos})`;
            if (img.classList.contains('bg-image-2')) {
                transform = `matrix(-1, 0, 0, 1, 0, ${yPos})`; // Для зеркального
            }
            
            img.style.transform = transform;
        });
    }
});









// Управление выпадающим списком
function initDropdown() {
    const selectWrappers = document.querySelectorAll('.select-wrapper');
    
    selectWrappers.forEach(wrapper => {
        const selectButton = wrapper.querySelector('.select-button');
        const dropdownMenu = wrapper.querySelector('.dropdown-menu');
        const dropdownItems = wrapper.querySelectorAll('.dropdown-item');
        const buttonText = wrapper.querySelector('.button-text');
        
        // Открытие/закрытие по клику на кнопку
        selectButton.addEventListener('click', function(e) {
            e.stopPropagation();
            wrapper.classList.toggle('active');
        });
        
        // Выбор элемента из списка
        dropdownItems.forEach(item => {
            item.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const text = this.textContent;
                
                // Обновляем текст кнопки
                buttonText.textContent = text;
                
                // Добавляем класс выбранного элемента
                dropdownItems.forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
                
                // Закрываем меню
                wrapper.classList.remove('active');
                
                // Можно добавить логику для использования выбранного значения
                console.log('Выбран город:', value, text);
            });
        });
        
        // Закрытие при клике вне меню
        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('active');
            }
        });
        
        // Закрытие при нажатии Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                wrapper.classList.remove('active');
            }
        });
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initDropdown);



// Добавьте в script.js для переключения active состояния
function initSpecialButtons() {
    const specialButtons = document.querySelectorAll('.special-option-btn');
    
    specialButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Снимаем active со всех кнопок в этой группе
            const parentContainer = this.closest('.special-options');
            if (parentContainer) {
                const allButtons = parentContainer.querySelectorAll('.special-option-btn');
                allButtons.forEach(btn => btn.classList.remove('active'));
            }
            
            // Добавляем active к нажатой кнопке
            this.classList.add('active');
        });
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initSpecialButtons);









// Калькулятор саженцев (кнопка не трогается)
function initCalculator() {
    const seedlingsInput = document.querySelector('.seedlings-input');
    const priceAmount = document.querySelector('.price-amount');
    
    if (!seedlingsInput || !priceAmount) return;
    
    const PRICE_PER_SEEDLING = 100;
    const MAX_SEEDLINGS = 9999999999;

    function calculatePrice() {
        let quantity = parseInt(seedlingsInput.value) || 0;
        
        
        // Обычный расчет
        const totalPrice = quantity * PRICE_PER_SEEDLING;
        const formattedPrice = totalPrice.toLocaleString('ru-RU');
        
        // Возвращаем обычные стили
        priceAmount.textContent = `${formattedPrice} ₽`;
        priceAmount.style.color = '';
        priceAmount.style.fontSize = '';
        priceAmount.style.fontWeight = '';
    }
    
    // Обработчики событий
    seedlingsInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        
        if (value.length > 10) {
            value = value.slice(0, 10);
            this.value = value;
        }
        
        calculatePrice();
    });
    
    seedlingsInput.addEventListener('change', function() {
        let value = parseInt(this.value) || 0;
        if (value > MAX_SEEDLINGS) {
            this.value = MAX_SEEDLINGS;
        }
        calculatePrice();
    });
    
    // Предотвращаем ввод нецифровых символов
    seedlingsInput.addEventListener('keydown', function(e) {
        if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
            (e.keyCode === 65 && e.ctrlKey) || 
            (e.keyCode === 67 && e.ctrlKey) ||
            (e.keyCode === 86 && e.ctrlKey) ||
            (e.keyCode === 88 && e.ctrlKey) ||
            (e.keyCode >= 48 && e.keyCode <= 57) ||
            (e.keyCode >= 96 && e.keyCode <= 105)) {
            return;
        }
        e.preventDefault();
    });
    
    // Инициализация
    calculatePrice();
}

document.addEventListener('DOMContentLoaded', initCalculator);




// Сильная и быстрая анимация поворота
function initStrongTiltAnimation() {
    const graphImg = document.querySelector('.graph-img');
    if (!graphImg) return;

    const settings = {
        maxTilt: 8,        // Сильный поворот
        maxLift: 15,       // Заметный подъем
        scaleEffect: 1.03, // Легкое увеличение
        sensitivity: 0.2,  // Высокая чувствительность
        returnSpeed: 0.6   // Быстрый возврат
    };

    let scrollTimeout;
    let lastScrollY = window.pageYOffset;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.pageYOffset;
        const scrollDelta = currentScrollY - lastScrollY;
        const scrollSpeed = Math.min(Math.abs(scrollDelta) * settings.sensitivity, 2);

        graphImg.classList.add('tilting');

        let targetTilt = 0;
        let targetLift = 0;
        let targetScale = 1;

        if (scrollDelta > 0) {
            // Скролл вниз - сильный поворот вправо и подъем
            targetTilt = scrollSpeed * settings.maxTilt;
            targetLift = scrollSpeed * settings.maxLift;
            targetScale = 1 + (scrollSpeed * (settings.scaleEffect - 1));
        } else {
            // Скролл вверх - поворот влево и опускание
            targetTilt = -scrollSpeed * settings.maxTilt * 0.6;
            targetLift = -scrollSpeed * settings.maxLift * 0.4;
            targetScale = 1 - (scrollSpeed * 0.02);
        }

        // Применяем трансформации
        graphImg.style.setProperty('--tilt-rotate', `${targetTilt}deg`);
        graphImg.style.setProperty('--tilt-lift', `${targetLift}px`);
        graphImg.style.setProperty('--tilt-scale', targetScale);

        lastScrollY = currentScrollY;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Быстрый возврат с пружинным эффектом
            graphImg.style.transition = `transform ${settings.returnSpeed}s cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
            graphImg.style.setProperty('--tilt-rotate', '0deg');
            graphImg.style.setProperty('--tilt-lift', '0px');
            graphImg.style.setProperty('--tilt-scale', '1');
            
            setTimeout(() => {
                graphImg.classList.remove('tilting');
                graphImg.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }, settings.returnSpeed * 1000);
        }, 80);
    });
}

// Динамичная версия с инерцией
function dynamicTiltAnimation() {
    const graphImg = document.querySelector('.graph-img');
    if (!graphImg) return;

    let targetTilt = 0;
    let targetLift = 0;
    let targetScale = 1;
    let currentTilt = 0;
    let currentLift = 0;
    let currentScale = 1;
    let lastScrollY = window.pageYOffset;
    let animationFrame;

    graphImg.classList.add('tilting');

    function updateTilt() {
        const currentScrollY = window.pageYOffset;
        const scrollDelta = currentScrollY - lastScrollY;
        const scrollIntensity = Math.min(Math.abs(scrollDelta) * 0.15, 3);

        // Быстрое обновление целей
        if (Math.abs(scrollDelta) > 0) {
            if (scrollDelta > 0) {
                targetTilt = scrollIntensity * 6;
                targetLift = scrollIntensity * 12;
                targetScale = 1 + scrollIntensity * 0.04;
            } else {
                targetTilt = -scrollIntensity * 4;
                targetLift = -scrollIntensity * 8;
                targetScale = 1 - scrollIntensity * 0.02;
            }
        } else {
            // Быстрый возврат к нулю
            targetTilt *= 0.8;
            targetLift *= 0.8;
            targetScale = 1;
        }

        // Быстрая интерполяция
        currentTilt += (targetTilt - currentTilt) * 0.3;
        currentLift += (targetLift - currentLift) * 0.3;
        currentScale += (targetScale - currentScale) * 0.3;

        graphImg.style.setProperty('--tilt-rotate', `${currentTilt}deg`);
        graphImg.style.setProperty('--tilt-lift', `${currentLift}px`);
        graphImg.style.setProperty('--tilt-scale', currentScale);

        lastScrollY = currentScrollY;
        animationFrame = requestAnimationFrame(updateTilt);
    }

    updateTilt();
}

// Агрессивная версия с заметным эффектом
function aggressiveTiltAnimation() {
    const graphImg = document.querySelector('.graph-img');
    if (!graphImg) return;

    const settings = {
        maxTilt: 1,       // Очень сильный поворот
        maxLift: 4,       // Заметный подъем
        scaleEffect: 1.01, // Заметное увеличение
        returnSpeed: 0.9  // Очень быстрый возврат
    };

    let scrollTimeout;
    let lastScrollY = window.pageYOffset;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.pageYOffset;
        const scrollDelta = currentScrollY - lastScrollY;
        const scrollPower = Math.min(Math.abs(scrollDelta) * 0.3, 3);

        graphImg.classList.add('tilting');

        let tilt, lift, scale;

        if (scrollDelta > 0) {
            tilt = scrollPower * settings.maxTilt;
            lift = scrollPower * settings.maxLift;
            scale = 1 + (scrollPower * (settings.scaleEffect - 1));
        } else {
            tilt = -scrollPower * settings.maxTilt * 0.8;
            lift = -scrollPower * settings.maxLift * 0.6;
            scale = 1 - (scrollPower * 0.05);
        }

        // Мгновенное применение
        graphImg.style.transition = 'transform 0.2s ease-out';
        graphImg.style.setProperty('--tilt-rotate', `${tilt}deg`);
        graphImg.style.setProperty('--tilt-lift', `${lift}px`);
        graphImg.style.setProperty('--tilt-scale', scale);

        lastScrollY = currentScrollY;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Очень быстрый возврат с bounce эффектом
            graphImg.style.transition = `transform ${settings.returnSpeed}s cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
            graphImg.style.setProperty('--tilt-rotate', '0deg');
            graphImg.style.setProperty('--tilt-lift', '0px');
            graphImg.style.setProperty('--tilt-scale', '1');
            
            setTimeout(() => {
                graphImg.classList.remove('tilting');
            }, settings.returnSpeed * 1000);
        }, 50);
    });
}

// Запускаем агрессивную версию
document.addEventListener('DOMContentLoaded', aggressiveTiltAnimation);

// Для других версий раскомментируйте:
// document.addEventListener('DOMContentLoaded', initStrongTiltAnimation);

// document.addEventListener('DOMContentLoaded', dynamicTiltAnimation);
