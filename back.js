document.addEventListener('DOMContentLoaded', function() {

    const submitButton = document.querySelector('.contacts-form-frame .submit-button');
    
    if (!submitButton) {
        console.error("Кнопка отправки формы не найдена!");
        return;
    }

    const formFrame = submitButton.closest('.contacts-form-frame');
    if (!formFrame) {
        console.error("Не удалось найти родительский элемент формы.");
        return;
    }

    // Добавляем ID к форме для упрощения доступа, если это возможно
    if (!formFrame.id) {
        formFrame.id = 'contactForm'; // Присваиваем ID, если его нет
    }

    const contactForm = document.getElementById('contactForm'); // Теперь будем использовать ID
    const responseMessageDiv = document.getElementById('responseMessage') || document.createElement('div');
    if (!document.getElementById('responseMessage')) {
        contactForm.appendChild(responseMessageDiv);
        responseMessageDiv.id = 'responseMessage';
        responseMessageDiv.style.marginTop = '20px';
    }

    contactForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Отменяем стандартное поведение отправки формы

        const nameInput = formFrame.querySelector('input[placeholder="Введите ваше имя"]');
        const emailInput = formFrame.querySelector('input[placeholder="Введите ваш email"]');
        const phoneInput = formFrame.querySelector('input[placeholder="Введите ваш телефон"]');
        const agreementCheckbox = formFrame.querySelector('#agreement');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const agreement = agreementCheckbox ? agreementCheckbox.checked : false;

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
            let errorHtml = '<p class="error"><b>Ошибки:</b></p>';
            errors.forEach(error => {
                errorHtml += `<p class="error">- ${error}</p>`;
            });
            responseMessageDiv.innerHTML = errorHtml;
            return;
        }

        const formData = {
            name: name,
            email: email,
            phone: phone,
            agreement: agreement
        };

        const backendUrl = 'https://backendtrees-production.up.railway.app/feedback/create';

        try {
            const response = await fetch(backendUrl, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) { }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            if (result.status === 'success') {
                responseMessageDiv.innerHTML = `<p class="success">${result.message || 'Ваши данные успешно отправлены!'}</p>`;
                contactForm.reset(); // Очищаем форму
            } else {
                responseMessageDiv.innerHTML = `<p class="error">${result.message || 'Произошла ошибка на сервере.'}</p>`;
            }

        } catch (error) {
            console.error('Ошибка отправки:', error);
            responseMessageDiv.innerHTML = `<p class="error">Произошла ошибка при отправке данных: ${error.message}</p>`;
        }
    });

    // --- Функция валидации Email ---
    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
});