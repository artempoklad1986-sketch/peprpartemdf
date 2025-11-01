// СИСТЕМА ПОДПИСОК АкваСбор v7.0 - ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ
class SubscriptionManager {
    constructor() {
        this.serverURL = 'subscription_handler.php';
        this.requestTimeout = 10000;
        this.maxRetries = 2;
        this.retryDelay = 1500;

        this.paymentInfo = {
            yandexCardNumber: '2000200998',
            vkGroupUrl: 'https://vk.com/akvariba'
        };

        this.userId = this.getOrCreateUserId();
        this.debugMode = localStorage.getItem('subscription_debug') === 'true';

        console.log('🚀 Система подписок АкваСбор v7.0 запущена для пользователя:', this.userId);

        this.addStyles();
        this.setupEventListeners();

        // КРИТИЧНО: Первичная проверка сразу после инициализации
        setTimeout(() => {
            console.log('🔄 Запускаем первичную проверку подписки...');
            this.checkSubscriptionStatus();
        }, 100);

        // Проверка каждые 30 секунд
        setInterval(() => {
            if (!document.hidden) {
                this.checkSubscriptionStatus();
            }
        }, 30000);
    }

    getOrCreateUserId() {
        let userId = localStorage.getItem('user_id') || 
                    localStorage.getItem('aquasbor_user_id') ||
                    localStorage.getItem('akvastor_user_id');

        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('aquasbor_user_id', userId);
        }

        return userId;
    }

    async fetchWithRetry(data, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

            const response = await fetch(this.serverURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data),
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            let result;

            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Ошибка парсинга JSON:', text);
                throw new Error('Некорректный ответ сервера');
            }

            if (this.debugMode) {
                console.log('📡 Запрос:', data);
                console.log('📥 Ответ:', result);
            }

            return result;

        } catch (error) {
            console.error(`❌ Ошибка запроса (попытка ${retryCount + 1}):`, error.message);

            if (retryCount < this.maxRetries && error.name !== 'AbortError') {
                await this.sleep(this.retryDelay);
                return this.fetchWithRetry(data, retryCount + 1);
            }

            throw error;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ГЛАВНАЯ ФУНКЦИЯ - ИСПРАВЛЕНА ПОЛНОСТЬЮ!
    async checkSubscriptionStatus() {
        try {
            console.log('🔍 Проверяем подписку для userId:', this.userId);

            const result = await this.fetchWithRetry({
                action: 'check_subscription',
                userId: this.userId,
                timestamp: Date.now()
            });

            if (result.success) {
                console.log('✅ Ответ сервера получен:', result);

                // КРИТИЧНО: НЕМЕДЛЕННО ОБНОВЛЯЕМ UI!
                this.forceUIUpdate(result);

                // Сохраняем в кэш
                this.saveToCache(result);

                // КРИТИЧНО: Отправляем события
                this.dispatchEvent('subscription-updated', result);
                this.dispatchEvent('subscription-status-updated', { 
                    hasSubscription: result.has_subscription, 
                    subscription: result.subscription 
                });

                // КРИТИЧНО: Дополнительные проверки для надежности
                setTimeout(() => this.forceUIUpdate(result), 100);
                setTimeout(() => this.forceUIUpdate(result), 500);

                return result;
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }

        } catch (error) {
            console.error('❌ Ошибка проверки подписки:', error.message);
            return this.handleError(error);
        }
    }

    // ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ UI - ПОЛНОСТЬЮ ПЕРЕПИСАНО!
    forceUIUpdate(data) {
        console.log('🔧 ПРИНУДИТЕЛЬНОЕ обновление UI:', data);

        const hasSubscription = data.has_subscription;
        const subscription = data.subscription;
        const isActive = hasSubscription && subscription?.is_active;

        // КРИТИЧНО: Устанавливаем глобальные переменные
        window.hasPROSubscription = isActive;
        window.subscriptionData = subscription;

        console.log('🌍 Глобальные переменные установлены:', {
            hasPROSubscription: window.hasPROSubscription,
            subscriptionData: window.subscriptionData
        });

        if (isActive) {
            console.log('✅ АКТИВИРУЕМ PRO функции...');
        } else {
            console.log('❌ ДЕАКТИВИРУЕМ PRO функции...');
        }

        // КРИТИЧНО: Обновляем ВСЕ возможные PRO элементы
        const proSelectors = [
            '.pro-feature', 
            '.pro-only', 
            '[data-pro]', 
            '.pro-disabled', 
            '.pro-enabled',
            '[data-pro="true"]',
            '.subscription-required',
            '.premium-feature'
        ];

        let totalUpdated = 0;

        proSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);

            elements.forEach((element, index) => {
                totalUpdated++;
                console.log(`🔄 Обрабатываем ${selector}[${index + 1}]:`, element.textContent.substring(0, 30) + '...');

                if (isActive) {
                    // РАЗБЛОКИРУЕМ
                    element.classList.remove('pro-disabled', 'disabled', 'locked');
                    element.classList.add('pro-enabled', 'unlocked');

                    // Убираем все виды блокировок с !important
                    element.style.setProperty('opacity', '1', 'important');
                    element.style.setProperty('pointer-events', 'all', 'important');
                    element.style.setProperty('filter', 'none', 'important');
                    element.style.setProperty('cursor', 'pointer', 'important');

                    // Визуальные улучшения для разблокированного состояния
                    element.style.setProperty('background-color', '#e8f5e8', 'important');
                    element.style.setProperty('border', '2px solid #4CAF50', 'important');
                    element.style.setProperty('border-radius', '8px', 'important');
                    element.style.setProperty('box-shadow', '0 2px 10px rgba(76, 175, 80, 0.3)', 'important');

                    console.log(`✅ РАЗБЛОКИРОВАН ${selector}[${index + 1}]`);
                } else {
                    // БЛОКИРУЕМ
                    element.classList.add('pro-disabled', 'disabled', 'locked');
                    element.classList.remove('pro-enabled', 'unlocked');

                    // Применяем блокировки с !important
                    element.style.setProperty('opacity', '0.5', 'important');
                    element.style.setProperty('pointer-events', 'none', 'important');
                    element.style.setProperty('filter', 'grayscale(1)', 'important');
                    element.style.setProperty('cursor', 'not-allowed', 'important');

                    // Визуальные улучшения для заблокированного состояния
                    element.style.setProperty('background-color', '#f5f5f5', 'important');
                    element.style.setProperty('border', '2px solid #ddd', 'important');
                    element.style.setProperty('border-radius', '8px', 'important');
                    element.style.setProperty('box-shadow', 'none', 'important');

                    console.log(`🔒 ЗАБЛОКИРОВАН ${selector}[${index + 1}]`);
                }
            });
        });

        console.log(`📊 Всего обновлено элементов: ${totalUpdated}`);

        // Обновляем кнопки подписки
        this.updateSubscriptionButtons(isActive, subscription);

        // Обновляем элементы статуса
        this.updateStatusElements(isActive, subscription);

        // Показываем уведомление при изменении статуса
        this.showStatusNotification(isActive);

        console.log('✅ ПРИНУДИТЕЛЬНОЕ обновление UI завершено. PRO статус:', isActive);
    }

    updateSubscriptionButtons(isActive, subscription) {
        const buttonSelectors = [
            '#subscriptionBtn', 
            '.subscription-btn', 
            '[data-subscription]',
            '.pro-upgrade-btn',
            '.premium-btn'
        ];

        buttonSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);

            buttons.forEach((btn, index) => {
                if (isActive) {
                    btn.innerHTML = `✅ PRO активен (${subscription?.days_left || 0} дней)`;
                    btn.style.setProperty('background', 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', 'important');
                    btn.style.setProperty('color', 'white', 'important');
                    btn.onclick = () => this.showSubscriptionInfo(subscription);
                    console.log(`✅ Кнопка ${selector}[${index + 1}] обновлена на PRO статус`);
                } else {
                    btn.innerHTML = '🚀 Подключить PRO (399₽)';
                    btn.style.setProperty('background', 'linear-gradient(135deg, #159895 0%, #57C5B6 100%)', 'important');
                    btn.style.setProperty('color', 'white', 'important');
                    btn.onclick = () => this.showSubscriptionForm();
                    console.log(`❌ Кнопка ${selector}[${index + 1}] обновлена на FREE статус`);
                }
            });
        });
    }

    updateStatusElements(isActive, subscription) {
        const statusSelectors = [
            '.subscription-status', 
            '#subscription-status',
            '.pro-status',
            '.premium-status'
        ];

        statusSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);

            elements.forEach(el => {
                if (isActive) {
                    el.innerHTML = `✅ PRO до ${subscription?.expires_date} (${subscription?.days_left} дней)`;
                    el.style.setProperty('color', '#4CAF50', 'important');
                    el.style.setProperty('font-weight', 'bold', 'important');
                } else {
                    el.innerHTML = '🚀 Подключить PRO';
                    el.style.setProperty('color', '#159895', 'important');
                    el.style.setProperty('font-weight', 'normal', 'important');
                }
            });
        });
    }

    showStatusNotification(isActive) {
        const cachedData = localStorage.getItem('subscription_cache');
        if (cachedData) {
            try {
                const cached = JSON.parse(cachedData);
                if (cached.has_subscription !== isActive) {
                    if (isActive) {
                        this.showNotification('🎉 PRO функции разблокированы!', 'success');
                    } else {
                        this.showNotification('⚠️ PRO функции заблокированы', 'info');
                    }
                }
            } catch (e) {
                console.warn('Ошибка чтения кэша уведомлений:', e);
            }
        }
    }

    // СТАНДАРТНОЕ обновление UI (вызывает принудительное)
    updateUI(data) {
        console.log('🎨 Обновляем UI:', data);
        this.forceUIUpdate(data);

        // Дополнительные проверки для надежности
        setTimeout(() => this.forceUIUpdate(data), 200);
        setTimeout(() => this.forceUIUpdate(data), 1000);
    }

    // Отправка заявки на подписку
    async sendSubscription(name, phone, email = '') {
        try {
            const result = await this.fetchWithRetry({
                action: 'subscribe',
                userId: this.userId,
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim(),
                plan: 'pro',
                amount: 399,
                timestamp: Date.now()
            });

            if (result.success) {
                this.showSuccessModal(result.id, name, phone, email);

                // Запускаем проверку подписки каждые 10 секунд после заявки
                let checkCount = 0;
                const maxChecks = 30; // 5 минут максимум

                const checkInterval = setInterval(() => {
                    checkCount++;
                    console.log(`🔄 Проверяем активацию подписки (попытка ${checkCount})...`);

                    this.checkSubscriptionStatus().then(status => {
                        if (status && status.has_subscription) {
                            console.log('🎉 Подписка активирована!');
                            clearInterval(checkInterval);
                            this.showNotification('🎉 PRO подписка активирована!', 'success');
                        } else if (checkCount >= maxChecks) {
                            console.log('⏰ Время проверки истекло');
                            clearInterval(checkInterval);
                        }
                    });
                }, 10000);

                return true;
            } else {
                throw new Error(result.error || 'Ошибка отправки заявки');
            }

        } catch (error) {
            console.error('❌ Ошибка отправки заявки:', error.message);
            this.showError('Ошибка отправки заявки: ' + error.message);
            return false;
        }
    }

    saveToCache(data) {
        const cacheData = {
            has_subscription: data.has_subscription,
            subscription: data.subscription,
            last_check: Date.now(),
            user_id: this.userId
        };
        localStorage.setItem('subscription_cache', JSON.stringify(cacheData));
        console.log('💾 Данные закэшированы:', cacheData);
    }

    handleError(error) {
        const cache = localStorage.getItem('subscription_cache');
        if (cache) {
            try {
                const parsed = JSON.parse(cache);
                const cacheAge = Date.now() - parsed.last_check;

                if (cacheAge < 6 * 60 * 60 * 1000) {
                    console.log('📱 Используем кэшированные данные (возраст: ' + Math.round(cacheAge/60000) + ' мин)');
                    this.forceUIUpdate(parsed);
                    return parsed;
                }
            } catch (e) {
                console.error('Ошибка чтения кэша:', e);
            }
        }

        console.log('❌ Fallback: нет подписки');
        this.forceUIUpdate({ has_subscription: false, subscription: null });
        return null;
    }

    setupEventListeners() {
        // При активации окна
        window.addEventListener('focus', () => {
            console.log('🎯 Окно активировано, проверяем подписку');
            setTimeout(() => this.checkSubscriptionStatus(), 500);
        });

        // При восстановлении интернета
        window.addEventListener('online', () => {
            console.log('🌐 Соединение восстановлено');
            setTimeout(() => this.checkSubscriptionStatus(), 1000);
        });

        // Автопривязка кнопок после загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.bindButtons(), 100);
            });
        } else {
            setTimeout(() => this.bindButtons(), 100);
        }

        // КРИТИЧНО: Дополнительные привязки
        setTimeout(() => this.bindButtons(), 1000);
        setTimeout(() => this.bindButtons(), 3000);
    }

    bindButtons() {
        const buttonSelectors = [
            '#subscriptionBtn', 
            '.subscription-btn', 
            '[data-subscription]',
            '.pro-upgrade-btn',
            '.premium-btn'
        ];

        buttonSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);

            buttons.forEach(btn => {
                // Удаляем старые обработчики
                btn.replaceWith(btn.cloneNode(true));
            });
        });

        // Привязываем новые обработчики
        let totalBound = 0;
        buttonSelectors.forEach(selector => {
            const newButtons = document.querySelectorAll(selector);

            newButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('🖱️ Клик по кнопке подписки. PRO статус:', window.hasPROSubscription);

                    if (window.hasPROSubscription) {
                        this.showSubscriptionInfo(window.subscriptionData);
                    } else {
                        this.showSubscriptionForm();
                    }
                });
                totalBound++;
            });
        });

        console.log('✅ Привязано кнопок подписки:', totalBound);
    }

    dispatchEvent(eventName, detail) {
        try {
            const event = new CustomEvent(eventName, { detail });
            window.dispatchEvent(event);
            console.log('📡 Событие отправлено:', eventName, detail);
        } catch (e) {
            console.error('Ошибка отправки события:', e);
        }
    }

    showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        const oldNotifications = document.querySelectorAll('.subscription-notification');
        oldNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `subscription-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 350px;
            animation: slideInRight 0.3s ease;
            font-weight: 600;
        `;
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentNode.parentNode.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSubscriptionForm() {
        const modal = this.createModal(`
            <h2>🚀 Подписка АкваСбор Pro</h2>
            <p style="color: #666; margin: 15px 0;">Получите полный доступ ко всем функциям приложения</p>

            <div class="plan-card recommended">
                <div class="plan-name">Pro ⭐</div>
                <div class="plan-price">399₽</div>
                <div class="plan-duration">в месяц</div>
                <ul class="plan-features">
                    <li>🐠 Безлимитная совместимость рыб</li>
                    <li>🌱 Умный подбор растений</li>
                    <li>🧮 Продвинутые калькуляторы</li>
                    <li>🎨 Мастер-класс акваскейпинга</li>
                    <li>📊 Детальная история и графики</li>
                    <li>📤 Экспорт всех данных</li>
                    <li>🛎️ Приоритетная поддержка</li>
                </ul>
            </div>

            <form id="subscriptionForm">
                <div class="form-group">
                    <label>Ваше имя *</label>
                    <input type="text" id="userName" required placeholder="Иван Петров">
                </div>
                <div class="form-group">
                    <label>Номер телефона *</label>
                    <input type="tel" id="userPhone" required placeholder="+7 999 123-45-67">
                </div>
                <div class="form-group">
                    <label>Email (необязательно)</label>
                    <input type="email" id="userEmail" placeholder="your@email.com">
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; margin: 15px 0;">
                    📝 Отправить заявку на активацию Pro (399₽)
                </button>
            </form>

            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                ❌ Закрыть
            </button>
        `);

        const form = modal.querySelector('#subscriptionForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = modal.querySelector('#userName').value.trim();
            const phone = modal.querySelector('#userPhone').value.trim();
            const email = modal.querySelector('#userEmail').value.trim();

            if (!name || !phone) {
                this.showError('Заполните имя и телефон!');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            btn.innerHTML = '⏳ Отправляем заявку...';
            btn.disabled = true;

            const success = await this.sendSubscription(name, phone, email);

            if (success) {
                modal.remove();
            } else {
                btn.innerHTML = '📝 Отправить заявку на активацию Pro (399₽)';
                btn.disabled = false;
            }
        });
    }

    showSuccessModal(requestId, name, phone, email) {
        this.createModal(`
            <h2 style="color: #4CAF50; text-align: center;">✅ Заявка успешно отправлена!</h2>
            <div class="success-info">
                <h4>📋 Ваши данные:</h4>
                <p><strong>👤 Имя:</strong> ${name}</p>
                <p><strong>📱 Телефон:</strong> ${phone}</p>
                ${email ? `<p><strong>📧 Email:</strong> ${email}</p>` : ''}
                <p><strong>💰 Сумма:</strong> 399₽</p>
                <p><strong>🆔 ID заявки:</strong> <code>${requestId}</code></p>
            </div>
            <div class="payment-info">
                <h4>💳 Способы оплаты:</h4>
                <div class="payment-method">
                    <h5>1️⃣ Яндекс Банк:</h5>
                    <div class="card-number">+7 ${this.paymentInfo.yandexCardNumber}</div>
                    <div class="amount">Сумма: 399₽</div>
                    <p>💡 В комментарии: <code>${requestId}</code></p>
                </div>
                <div class="payment-method">
                    <h5>2️⃣ Группа ВКонтакте:</h5>
                    <a href="${this.paymentInfo.vkGroupUrl}" target="_blank" class="vk-link">📱 Написать в ВК</a>
                    <p>Сообщите ID: <code>${requestId}</code></p>
                </div>
            </div>
            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                ✅ Понятно, перехожу к оплате
            </button>
        `);
    }

    showSubscriptionInfo(subscription) {
        this.createModal(`
            <h2 style="color: #4CAF50; text-align: center;">✅ PRO подписка активна</h2>
            <div class="subscription-info">
                <p><strong>📅 Активна до:</strong> ${subscription?.expires_date || 'Неизвестно'}</p>
                <p><strong>⏰ Осталось дней:</strong> 
                   <span style="color: ${(subscription?.days_left || 0) <= 3 ? '#f44336' : '#4CAF50'}; font-weight: bold;">
                       ${subscription?.days_left || 0}
                   </span>
                </p>
                <p><strong>📦 Тариф:</strong> PRO ⭐</p>
                <p><strong>🆔 ID:</strong> <code>${subscription?.id || 'unknown'}</code></p>
            </div>
            <div class="pro-features">
                <h4>🚀 Ваши PRO возможности:</h4>
                <ul>
                    <li>🐠 Безлимитная совместимость рыб</li>
                    <li>🧮 Продвинутые калькуляторы</li>
                    <li>🎨 Мастер-класс акваскейпинга</li>
                    <li>📊 Детальная история и графики</li>
                    <li>📤 Экспорт всех данных</li>
                </ul>
            </div>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">❌ Закрыть</button>
        `);
    }

    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal-content" onclick="event.stopPropagation()">${content}</div>`;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
        return modal;
    }

    addStyles() {
        if (document.getElementById('subscription-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'subscription-styles';
        styles.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            .modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center;
                z-index: 10000; animation: fadeIn 0.3s ease;
            }

            .modal-content {
                background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%;
                max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease;
            }

            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

            .plan-card { border: 2px solid #4CAF50; border-radius: 15px; padding: 25px; text-align: center; margin: 20px 0; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); position: relative; }
            .plan-card.recommended::before { content: '🌟 РЕКОМЕНДУЕМ'; position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #4CAF50; color: white; padding: 5px 15px; border-radius: 15px; font-size: 12px; font-weight: bold; }
            .plan-name { font-size: 1.5rem; font-weight: bold; color: white; margin-bottom: 10px; padding: 10px; border-radius: 8px; background: #4CAF50; }
            .plan-price { font-size: 2rem; font-weight: bold; color: #159895; margin: 15px 0; }
            .plan-duration { color: #666; font-size: 14px; margin-bottom: 20px; }
            .plan-features { list-style: none; padding: 0; margin: 20px 0; text-align: left; }
            .plan-features li { padding: 8px 0; color: #555; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
            .form-group { margin: 15px 0; text-align: left; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50; }
            .form-group input { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
            .form-group input:focus { outline: none; border-color: #57C5B6; box-shadow: 0 0 10px rgba(87, 197, 182, 0.2); }
            .btn { display: inline-block; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin: 5px 0; transition: all 0.3s; text-decoration: none; text-align: center; }
            .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); }
            .btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .btn-primary { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; }
            .btn-secondary { background: #666; color: white; }
            .success-info, .subscription-info, .payment-info, .pro-features { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .success-info h4, .subscription-info h4, .payment-info h4, .pro-features h4 { color: #2c3e50; margin-bottom: 15px; }
            .payment-method { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .card-number { font-size: 24px; font-weight: bold; font-family: monospace; color: #2e7d32; margin: 10px 0; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 5px; }
            .amount { font-size: 20px; font-weight: bold; color: #d32f2f; text-align: center; margin: 10px 0; }
            .vk-link { display: inline-block; background: linear-gradient(135deg, #4c75a3 0%, #3d5a85 100%); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 0; }

            /* КРИТИЧНО: Стили для PRO элементов */
            .pro-disabled { 
                opacity: 0.5 !important; 
                pointer-events: none !important; 
                filter: grayscale(1) !important; 
                cursor: not-allowed !important;
            }
            .pro-enabled { 
                opacity: 1 !important; 
                pointer-events: all !important; 
                filter: none !important; 
                cursor: pointer !important;
            }
            .pro-feature, .pro-only, [data-pro] {
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(styles);
    }
}

// КРИТИЧНО: Инициализация с защитой от ошибок
let subscriptionManager;

function initializeSubscriptionManager() {
    try {
        if (window.subscriptionManager) {
            console.log('⚠️ SubscriptionManager уже существует, пересоздаем...');
        }

        subscriptionManager = new SubscriptionManager();
        window.subscriptionManager = subscriptionManager;

        // Глобальные функции для совместимости
        window.showSubscription = () => subscriptionManager.showSubscriptionForm();
        window.checkSubscription = () => subscriptionManager.checkSubscriptionStatus();

        console.log('✅ СИСТЕМА ПОДПИСОК АкваСбор v7.0 УСПЕШНО ЗАГРУЖЕНА');

        // КРИТИЧНО: Дополнительные проверки через разные интервалы
        setTimeout(() => {
            console.log('🔄 Дополнительная проверка подписки через 2 секунды...');
            subscriptionManager.checkSubscriptionStatus();
        }, 2000);

        setTimeout(() => {
            console.log('🔄 Финальная проверка подписки через 5 секунд...');
            subscriptionManager.checkSubscriptionStatus();
        }, 5000);

    } catch (error) {
        console.error('❌ Критическая ошибка инициализации системы подписок:', error);

        // Повторная попытка через 2 секунды
        setTimeout(() => {
            console.log('🔄 Повторная попытка инициализации...');
            initializeSubscriptionManager();
        }, 2000);
    }
}

// Запускаем инициализацию с защитой
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeSubscriptionManager, 100);
    });
} else {
    setTimeout(initializeSubscriptionManager, 100);
}

// Дополнительная инициализация при полной загрузке страницы
window.addEventListener('load', () => {
    if (!window.subscriptionManager) {
        console.log('🔄 Запускаем инициализацию при window.load...');
        setTimeout(initializeSubscriptionManager, 500);
    }
});
