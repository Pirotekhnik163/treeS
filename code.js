
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
            const response = await fetch(`${this.baseUrl}/feedback/create`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
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

            if (result.status === 'success') {
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
