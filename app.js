// ============================================================================
// АКВАCБОР PRO - APP.JS v3.1 СОВМЕСТИМОСТЬ С INDEX.HTML
// Реализация всех функций из index.html с модульными калькуляторами
// ============================================================================

console.log('🚀 АкваСбор PRO app.js v3.1 - ЗАГРУЗКА ФУНКЦИЙ...');

// ============================================================================
// ГЛОБАЛЬНАЯ АРХИТЕКТУРА ПРИЛОЖЕНИЯ
// ============================================================================

window.AkvaStorPro = {
    version: '3.1.0',

    // База данных (загружается из data/)
    database: {
        fish: null,
        plants: null,
        loaded: false,
        loading: false
    },

    // Пользовательские данные
    userData: {
        aquarium: {},
        photos: [],
        notes: [],
        waterTests: [],
        tasks: [],
        myFish: [],
        myPlants: []
    },

    // Загруженные калькуляторы
    calculators: {},

    // Система подписок
    subscription: {
        status: 'free', // free, trial, pro
        isPro: false
    }
};

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 Инициализация АкваСбор PRO v3.1...');

    // Загружаем базы данных
    await loadDatabases();

    // Загружаем пользовательские данные
    loadUserData();

    // Проверяем подписку
    initializeSubscription();

    // Обновляем статистику
    updateAllStats();

    // Инициализируем PWA
    initializePWA();

    console.log('✅ АкваСбор PRO v3.1 готов к работе!');
    showToast('🚀 Все системы загружены!', 'success');
});

// ============================================================================
// ЗАГРУЗКА БАЗ ДАННЫХ ИЗ data/
// ============================================================================

async function loadDatabases() {
    if (window.AkvaStorPro.database.loading) return;

    window.AkvaStorPro.database.loading = true;
    console.log('📊 Загружаем базы данных из data/...');

    try {
        // Параллельная загрузка БД
        const [fishResponse, plantsResponse] = await Promise.all([
            fetch('./data/fish-database.json'),
            fetch('./data/plants-database.json')
        ]);

        if (fishResponse.ok) {
            window.AkvaStorPro.database.fish = await fishResponse.json();
            console.log('✅ База рыб:', Object.keys(window.AkvaStorPro.database.fish).length, 'видов');
        }

        if (plantsResponse.ok) {
            window.AkvaStorPro.database.plants = await plantsResponse.json();
            console.log('✅ База растений:', Object.keys(window.AkvaStorPro.database.plants).length, 'видов');
        }

        window.AkvaStorPro.database.loaded = true;
        window.AkvaStorPro.database.loading = false;

    } catch (error) {
        console.error('❌ Ошибка загрузки БД:', error);
        window.AkvaStorPro.database.fish = {};
        window.AkvaStorPro.database.plants = {};
        window.AkvaStorPro.database.loaded = true;
        window.AkvaStorPro.database.loading = false;
    }
}

// ============================================================================
// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЬСКИМИ ДАННЫМИ
// ============================================================================

function loadUserData() {
    try {
        // Загружаем все данные из localStorage
        const dataKeys = {
            'akvastor_aquarium_params': 'aquarium',
            'akvastor_notes': 'notes',
            'akvastor_test_history': 'waterTests',
            'akvastor_photos': 'photos',
            'akvastor_tasks': 'tasks',
            'akvastor_my_fish': 'myFish',
            'akvastor_my_plants': 'myPlants'
        };

        Object.entries(dataKeys).forEach(([storageKey, dataKey]) => {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    window.AkvaStorPro.userData[dataKey] = JSON.parse(stored);
                } catch (e) {
                    window.AkvaStorPro.userData[dataKey] = dataKey === 'aquarium' ? {} : [];
                }
            }
        });

        // Заполняем форму аквариума
        fillAquariumForm();

        console.log('📊 Пользовательские данные загружены');

    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
    }
}

function saveUserData() {
    try {
        localStorage.setItem('akvastor_aquarium_params', JSON.stringify(window.AkvaStorPro.userData.aquarium));
        localStorage.setItem('akvastor_notes', JSON.stringify(window.AkvaStorPro.userData.notes));
        localStorage.setItem('akvastor_test_history', JSON.stringify(window.AkvaStorPro.userData.waterTests));
        localStorage.setItem('akvastor_photos', JSON.stringify(window.AkvaStorPro.userData.photos));
        localStorage.setItem('akvastor_tasks', JSON.stringify(window.AkvaStorPro.userData.tasks));
        localStorage.setItem('akvastor_my_fish', JSON.stringify(window.AkvaStorPro.userData.myFish));
        localStorage.setItem('akvastor_my_plants', JSON.stringify(window.AkvaStorPro.userData.myPlants));
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
    }
}

function fillAquariumForm() {
    const params = window.AkvaStorPro.userData.aquarium;
    if (!params || Object.keys(params).length === 0) return;

    // Заполняем поля формы
    const fields = {
        'aquariumVolume': 'volume',
        'aquariumStartDate': 'startDate',
        'aquariumType': 'type',
        'filtrationSystem': 'filtration',
        'aquariumLighting': 'lighting',
        'co2System': 'co2',
        'aquariumLength': 'length',
        'aquariumWidth': 'width',
        'aquariumHeight': 'height',
        'glassThickness': 'glassThickness',
        'heaterPower': 'heaterPower',
        'filterFlow': 'filterFlow',
        'airPump': 'airPump',
        'uvSterilizer': 'uvSterilizer'
    };

    Object.entries(fields).forEach(([fieldId, paramKey]) => {
        const element = document.getElementById(fieldId);
        if (element && params[paramKey]) {
            element.value = params[paramKey];
        }
    });
}

// ============================================================================
// ФУНКЦИИ ИЗ INDEX.HTML - АКВАРИУМ
// ============================================================================

// Сохранение параметров аквариума
function saveAquariumParams() {
    const params = {
        volume: document.getElementById('aquariumVolume')?.value || '',
        startDate: document.getElementById('aquariumStartDate')?.value || '',
        type: document.getElementById('aquariumType')?.value || '',
        filtration: document.getElementById('filtrationSystem')?.value || '',
        lighting: document.getElementById('aquariumLighting')?.value || '',
        co2: document.getElementById('co2System')?.value || '',
        length: document.getElementById('aquariumLength')?.value || '',
        width: document.getElementById('aquariumWidth')?.value || '',
        height: document.getElementById('aquariumHeight')?.value || '',
        glassThickness: document.getElementById('glassThickness')?.value || '',
        heaterPower: document.getElementById('heaterPower')?.value || '',
        filterFlow: document.getElementById('filterFlow')?.value || '',
        airPump: document.getElementById('airPump')?.value || '',
        uvSterilizer: document.getElementById('uvSterilizer')?.value || ''
    };

    window.AkvaStorPro.userData.aquarium = params;
    saveUserData();

    showToast('💾 Параметры аквариума сохранены!', 'success');
    updateAllStats();
}

// Расчет характеристик аквариума
function calculateAquariumStats() {
    const volume = parseFloat(document.getElementById('aquariumVolume')?.value) || 0;
    const length = parseFloat(document.getElementById('aquariumLength')?.value) || 0;
    const width = parseFloat(document.getElementById('aquariumWidth')?.value) || 0;
    const height = parseFloat(document.getElementById('aquariumHeight')?.value) || 0;
    const glassThickness = parseFloat(document.getElementById('glassThickness')?.value) || 6;

    if (!volume && (!length || !width || !height)) {
        showToast('⚠️ Введите размеры аквариума', 'warning');
        return;
    }

    let calculatedVolume = volume;
    if (!volume && length && width && height) {
        calculatedVolume = (length * width * height) / 1000;
    }

    // Расчет веса воды
    const waterWeight = calculatedVolume * 1; // 1л = 1кг

    // Расчет общего веса
    const glassVolume = calculateGlassVolume(length, width, height, glassThickness);
    const glassWeight = glassVolume * 2.5; // плотность стекла 2.5 г/см³
    const totalWeight = waterWeight + glassWeight;

    // Рекомендации по подставке
    const supportRecommendation = totalWeight < 50 ? 'Легкая подставка' : 
                                 totalWeight < 200 ? 'Усиленная подставка' : 
                                 'Специальная подставка';

    // Рекомендации по оборудованию
    const heaterPower = Math.ceil(calculatedVolume * 1.5); // 1.5 Вт на литр
    const filterFlow = Math.ceil(calculatedVolume * 3); // 3 оборота в час

    const resultHTML = `
        <div class="calc-result">
            <h5>📊 Расчет характеристик аквариума</h5>
            <div class="parameter-card">
                <div class="parameter-value">${calculatedVolume.toFixed(1)} л</div>
                <div>Объем аквариума</div>
            </div>
            <div class="parameter-card">
                <div class="parameter-value">${waterWeight.toFixed(1)} кг</div>
                <div>Вес воды</div>
            </div>
            <div class="parameter-card">
                <div class="parameter-value">${totalWeight.toFixed(1)} кг</div>
                <div>Общий вес (с водой)</div>
            </div>
            <div class="parameter-card">
                <div class="parameter-value">${supportRecommendation}</div>
                <div>Тип подставки</div>
            </div>
            <h5>🔧 Рекомендации по оборудованию:</h5>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>Обогреватель:</strong> ${heaterPower} Вт</li>
                <li><strong>Фильтр:</strong> ${filterFlow} л/ч</li>
                <li><strong>Освещение:</strong> ${Math.ceil(calculatedVolume * 0.5)} Вт LED</li>
                <li><strong>Компрессор:</strong> ${calculatedVolume < 100 ? '5-10' : '10-20'} л/мин</li>
            </ul>
        </div>
    `;

    const resultDiv = document.getElementById('aquariumCalculationResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }

    showToast('📊 Характеристики рассчитаны!', 'success');
}

function calculateGlassVolume(length, width, height, thickness) {
    // Расчет объема стекла для аквариума
    const t = thickness / 10; // мм в см
    const front = length * height * t;
    const back = length * height * t;
    const left = width * height * t;
    const right = width * height * t;
    const bottom = length * width * t;
    return (front + back + left + right + bottom);
}

// Экспорт данных аквариума
function exportAquariumData() {
    const data = {
        aquarium: window.AkvaStorPro.userData.aquarium,
        photos: window.AkvaStorPro.userData.photos,
        notes: window.AkvaStorPro.userData.notes,
        waterTests: window.AkvaStorPro.userData.waterTests,
        tasks: window.AkvaStorPro.userData.tasks,
        myFish: window.AkvaStorPro.userData.myFish,
        myPlants: window.AkvaStorPro.userData.myPlants,
        exportDate: new Date().toISOString(),
        version: '3.1.0'
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `akvastor_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('📤 Данные экспортированы в файл!', 'success');
}

// ============================================================================
// ФУНКЦИИ ИЗ INDEX.HTML - ФОТОГАЛЕРЕЯ
// ============================================================================

// Фото с камеры
function takePhoto() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('❌ Камера не поддерживается', 'error');
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.style.maxWidth = '100%';

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class='modal-content' style='text-align: center;'>
                    <button class='modal-close' onclick='this.closest(".modal-overlay").remove(); stopCamera();'>×</button>
                    <h3>📷 Сделать фото аквариума</h3>
                    <div id='cameraView' style='margin: 20px 0;'></div>
                    <div>
                        <button class='btn btn-primary' onclick='capturePhoto()'>📸 Сделать снимок</button>
                        <button class='btn btn-secondary' onclick='this.closest(".modal-overlay").remove(); stopCamera();'>❌ Отмена</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            document.getElementById('cameraView').appendChild(video);

            window.currentStream = stream;
            window.currentVideo = video;
        })
        .catch(error => {
            console.error('❌ Ошибка камеры:', error);
            showToast('❌ Не удалось получить доступ к камере', 'error');
        });
}

function stopCamera() {
    if (window.currentStream) {
        window.currentStream.getTracks().forEach(track => track.stop());
        window.currentStream = null;
        window.currentVideo = null;
    }
}

function capturePhoto() {
    const video = window.currentVideo;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoData = {
                id: Date.now(),
                data: e.target.result,
                name: `photo_${new Date().toISOString().split('T')[0]}_${Date.now()}.jpg`,
                date: new Date().toISOString(),
                size: blob.size
            };

            window.AkvaStorPro.userData.photos.push(photoData);
            saveUserData();
            updatePhotoGallery();
            updateAllStats();

            showToast('📸 Фото сохранено!', 'success');
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);

    stopCamera();
    document.querySelector('.modal-overlay')?.remove();
}

// Экспорт фотографий
function exportPhotos() {
    const photos = window.AkvaStorPro.userData.photos;
    if (photos.length === 0) {
        showToast('⚠️ Нет фотографий для экспорта', 'warning');
        return;
    }

    photos.forEach(photo => {
        const a = document.createElement('a');
        a.href = photo.data;
        a.download = photo.name || `photo_${photo.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    showToast(`📤 Экспортировано ${photos.length} фотографий!`, 'success');
}

// Очистка галереи
function clearAllPhotos() {
    if (!confirm('❓ Удалить ВСЕ фотографии? Это действие нельзя отменить.')) {
        return;
    }

    window.AkvaStorPro.userData.photos = [];
    saveUserData();
    updatePhotoGallery();
    updateAllStats();

    showToast('🗑️ Все фотографии удалены!', 'success');
}

// ============================================================================
// ФУНКЦИИ ИЗ INDEX.HTML - ЗАМЕТКИ
// ============================================================================

// Добавление быстрой заметки
function addQuickNote(text) {
    const noteText = text || document.getElementById('noteInput')?.value;
    if (!noteText || !noteText.trim()) {
        showToast('⚠️ Введите текст заметки', 'warning');
        return;
    }

    const note = {
        id: Date.now(),
        text: noteText.trim(),
        date: new Date().toISOString(),
        type: text ? 'quick' : 'manual'
    };

    window.AkvaStorPro.userData.notes.push(note);
    saveUserData();
    updateNotesList();
    updateAllStats();

    // Очищаем поле ввода только если это была ручная заметка
    if (!text) {
        const noteInput = document.getElementById('noteInput');
        if (noteInput) noteInput.value = '';
    }

    showToast('📝 Заметка добавлена!', 'success');
}

// Экспорт заметок
function exportNotes() {
    const notes = window.AkvaStorPro.userData.notes;
    if (notes.length === 0) {
        showToast('⚠️ Нет заметок для экспорта', 'warning');
        return;
    }

    let content = 'ЖУРНАЛ НАБЛЮДЕНИЙ АКВАРИУМА\n';
    content += '==================================\n\n';

    notes.forEach(note => {
        const date = new Date(note.date).toLocaleString('ru-RU');
        content += `${date}\n`;
        content += `${note.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `akvastor_notes_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('📤 Заметки экспортированы!', 'success');
}

// Поиск в заметках
function searchNotes() {
    const query = prompt('🔍 Поиск в заметках:', '');
    if (!query) return;

    const notes = window.AkvaStorPro.userData.notes;
    const found = notes.filter(note => 
        note.text.toLowerCase().includes(query.toLowerCase())
    );

    if (found.length === 0) {
        showToast(`❌ Заметки с "${query}" не найдены`, 'warning');
        return;
    }

    let resultsHTML = `<h4>🔍 Найдено заметок: ${found.length}</h4>`;
    found.forEach(note => {
        const date = new Date(note.date).toLocaleString('ru-RU');
        resultsHTML += `
            <div class="note-item" style="margin: 10px 0;">
                <div class="note-date">${date}</div>
                <div class="note-text">${note.text.replace(new RegExp(query, 'gi'), `<mark>$&</mark>`)}</div>
            </div>
        `;
    });

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class='modal-content' style='max-width: 600px;'>
            <button class='modal-close' onclick='this.closest(".modal-overlay").remove()'>×</button>
            ${resultsHTML}
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
    showToast(`✅ Найдено ${found.length} заметок`, 'success');
}

// ============================================================================
// ФУНКЦИИ ИЗ INDEX.HTML - АНАЛИЗ ВОДЫ
// ============================================================================

// Экспресс-тест воды
function performQuickTest() {
    const pH = parseFloat(document.getElementById('quickPH')?.value);
    const temp = parseFloat(document.getElementById('quickTemp')?.value);
    const ammonia = parseFloat(document.getElementById('quickAmmonia')?.value);
    const nitrites = parseFloat(document.getElementById('quickNitrites')?.value);
    const nitrates = parseFloat(document.getElementById('quickNitrates')?.value);
    const oxygen = parseFloat(document.getElementById('quickOxygen')?.value);

    const testResult = {
        id: Date.now(),
        date: new Date().toISOString(),
        pH: pH || null,
        temperature: temp || null,
        ammonia: ammonia || null,
        nitrites: nitrites || null,
        nitrates: nitrates || null,
        oxygen: oxygen || null
    };

    // Анализ результатов
    let overallStatus = 'excellent';
    let warnings = [];
    let recommendations = [];

    // Анализ pH
    if (pH) {
        if (pH < 6.0 || pH > 8.5) {
            overallStatus = 'danger';
            warnings.push(`pH ${pH} критично для большинства рыб`);
            recommendations.push('Нормализуйте pH до диапазона 6.5-7.5');
        } else if (pH < 6.5 || pH > 8.0) {
            if (overallStatus === 'excellent') overallStatus = 'warning';
            warnings.push(`pH ${pH} не оптимален`);
        }
    }

    // Анализ аммиака
    if (ammonia !== null && ammonia > 0) {
        if (ammonia > 0.25) {
            overallStatus = 'danger';
            warnings.push(`NH₃/NH₄ ${ammonia} мг/л ТОКСИЧНО!`);
            recommendations.push('ЭКСТРЕННАЯ подмена воды 50-75%!');
        } else if (ammonia > 0.1) {
            overallStatus = 'warning';
            warnings.push(`NH₃/NH₄ ${ammonia} мг/л повышен`);
            recommendations.push('Подмена воды 30-40%');
        }
    }

    // Анализ нитритов
    if (nitrites !== null && nitrites > 0) {
        if (nitrites > 0.25) {
            overallStatus = 'danger';
            warnings.push(`NO₂ ${nitrites} мг/л критично!`);
            recommendations.push('Подмена воды + усиление аэрации');
        } else if (nitrites > 0.1) {
            if (overallStatus === 'excellent') overallStatus = 'warning';
            warnings.push(`NO₂ ${nitrites} мг/л повышен`);
        }
    }

    // Анализ нитратов
    if (nitrates !== null) {
        if (nitrates > 50) {
            if (overallStatus === 'excellent') overallStatus = 'warning';
            warnings.push(`NO₃ ${nitrates} мг/л высокие`);
            recommendations.push('Увеличьте частоту подмен воды');
        }
    }

    // Анализ кислорода
    if (oxygen !== null) {
        if (oxygen < 4) {
            overallStatus = 'danger';
            warnings.push(`O₂ ${oxygen} мг/л недостаточно!`);
            recommendations.push('Усильте аэрацию немедленно!');
        } else if (oxygen < 5) {
            if (overallStatus === 'excellent') overallStatus = 'warning';
            warnings.push(`O₂ ${oxygen} мг/л низковато`);
        }
    }

    // Токсичность аммиака
    let ammoniaInfo = '';
    if (pH && ammonia !== null && temp) {
        const toxicAmmonia = calculateToxicAmmonia(ammonia, pH, temp);
        if (toxicAmmonia > 0.02) {
            overallStatus = 'danger';
            ammoniaInfo = `<div class="parameter-card" style="background: #f8d7da; border-left-color: #dc3545;">
                <strong>☠️ Токсичный NH₃: ${toxicAmmonia.toFixed(3)} мг/л</strong><br>
                <small>КРИТИЧНО! Безопасный уровень < 0.02 мг/л</small>
            </div>`;
        } else if (toxicAmmonia > 0.01) {
            ammoniaInfo = `<div class="parameter-card" style="background: #fff3cd; border-left-color: #ffc107;">
                <strong>⚠️ Токсичный NH₃: ${toxicAmmonia.toFixed(3)} мг/л</strong><br>
                <small>Повышено, следите за рыбами</small>
            </div>`;
        } else {
            ammoniaInfo = `<div class="parameter-card" style="background: #d4edda; border-left-color: #28a745;">
                <strong>✅ Токсичный NH₃: ${toxicAmmonia.toFixed(3)} мг/л</strong><br>
                <small>Безопасный уровень</small>
            </div>`;
        }
    }

    let resultHTML = `
        <div class="test-result ${overallStatus}">
            <h5>🔬 Результаты экспресс-теста воды</h5>
            <div style="margin: 15px 0;">
                <strong>Дата тестирования:</strong> ${new Date().toLocaleString('ru-RU')}
            </div>

            ${ammoniaInfo}

            ${warnings.length > 0 ? `
                <div style="margin: 15px 0;">
                    <strong>⚠️ Обнаруженные проблемы:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${warnings.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${recommendations.length > 0 ? `
                <div style="margin: 15px 0;">
                    <strong>💡 Рекомендации:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div style="margin: 15px 0;">
                <strong>Общая оценка:</strong> 
                ${overallStatus === 'excellent' ? '✅ Отлично' : 
                  overallStatus === 'warning' ? '⚠️ Требует внимания' : 
                  '❌ Критично'}
            </div>
        </div>
    `;

    const resultDiv = document.getElementById('quickTestResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }

    // Сохраняем результат
    window.AkvaStorPro.userData.waterTests.push(testResult);
    saveUserData();
    updateAllStats();

    showToast('🔬 Экспресс-тест завершен!', 'success');
}

// Очистка полей теста
function clearQuickTest() {
    const fields = ['quickPH', 'quickTemp', 'quickAmmonia', 'quickNitrites', 'quickNitrates', 'quickOxygen'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) element.value = '';
    });

    const resultDiv = document.getElementById('quickTestResult');
    if (resultDiv) resultDiv.innerHTML = '';

    showToast('🗑️ Поля очищены', 'info');
}

// Загрузка последнего теста
function loadLastTest() {
    const tests = window.AkvaStorPro.userData.waterTests;
    if (tests.length === 0) {
        showToast('⚠️ Нет сохраненных тестов', 'warning');
        return;
    }

    const lastTest = tests[tests.length - 1];

    if (lastTest.pH) document.getElementById('quickPH').value = lastTest.pH;
    if (lastTest.temperature) document.getElementById('quickTemp').value = lastTest.temperature;
    if (lastTest.ammonia) document.getElementById('quickAmmonia').value = lastTest.ammonia;
    if (lastTest.nitrites) document.getElementById('quickNitrites').value = lastTest.nitrites;
    if (lastTest.nitrates) document.getElementById('quickNitrates').value = lastTest.nitrates;
    if (lastTest.oxygen) document.getElementById('quickOxygen').value = lastTest.oxygen;

    showToast('📋 Последний тест загружен!', 'success');
}

// ============================================================================
// МОДУЛЬНЫЙ КАЛЬКУЛЯТОР ТОКСИЧНОСТИ АММИАКА
// ============================================================================

function calculateAmmoniaToxicity() {
    const totalAmmonia = parseFloat(document.getElementById('totalAmmonia')?.value);
    const pH = parseFloat(document.getElementById('ammoniaPH')?.value);
    const temp = parseFloat(document.getElementById('ammoniaTemp')?.value);

    if (!totalAmmonia || !pH || !temp) {
        showToast('⚠️ Заполните все поля для расчета', 'warning');
        return;
    }

    const toxicAmmonia = calculateToxicAmmonia(totalAmmonia, pH, temp);
    const percentToxic = (toxicAmmonia / totalAmmonia) * 100;

    let status = 'excellent';
    let statusText = '✅ Безопасно';
    let recommendation = 'Уровень токсичного аммиака в норме';

    if (toxicAmmonia > 0.05) {
        status = 'danger';
        statusText = '❌ ТОКСИЧНО!';
        recommendation = 'ЭКСТРЕННАЯ подмена воды 75%! Усильте аэрацию!';
    } else if (toxicAmmonia > 0.02) {
        status = 'warning';
        statusText = '⚠️ Повышено';
        recommendation = 'Подмена воды 50%, контролируйте состояние рыб';
    }

    const resultHTML = `
        <div class="calc-result">
            <h5>⚗️ Расчет токсичности аммиака</h5>
            <div class="parameter-card">
                <div class="parameter-value">${toxicAmmonia.toFixed(4)} мг/л</div>
                <div>Концентрация токсичного NH₃</div>
            </div>
            <div class="parameter-card">
                <div class="parameter-value">${percentToxic.toFixed(2)}%</div>
                <div>Доля токсичной формы</div>
            </div>
            <div class="test-result ${status}">
                <strong>${statusText}</strong><br>
                ${recommendation}
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 15px;">
                Формула Хендерсона-Хассельбаха с температурной коррекцией<br>
                pKa = 9.25 + ((273.15 + T) × 0.03)
            </div>
        </div>
    `;

    const resultDiv = document.getElementById('ammoniaToxicityResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }
}

function calculateToxicAmmonia(totalAmmonia, pH, temperature) {
    // Научная формула токсичности аммиака по Хендерсону-Хассельбаху
    const pKa = 9.25 + ((273.15 + temperature) * 0.03);
    const fractionNH3 = 1 / (1 + Math.pow(10, (pKa - pH)));
    return totalAmmonia * fractionNH3;
}

// Полный анализ параметров
function analyzeAllParameters() {
    showToast('🔬 Запуск полного анализа...', 'info');

    // Собираем все параметры
    const params = {
        // Основные
        pH: parseFloat(document.getElementById('quickPH')?.value) || null,
        temperature: parseFloat(document.getElementById('quickTemp')?.value) || null,
        ammonia: parseFloat(document.getElementById('quickAmmonia')?.value) || null,
        nitrites: parseFloat(document.getElementById('quickNitrites')?.value) || null,
        nitrates: parseFloat(document.getElementById('quickNitrates')?.value) || null,
        oxygen: parseFloat(document.getElementById('quickOxygen')?.value) || null,

        // Жесткость
        gh: parseFloat(document.getElementById('gh')?.value) || null,
        kh: parseFloat(document.getElementById('kh')?.value) || null,
        tds: parseFloat(document.getElementById('tds')?.value) || null,
        conductivity: parseFloat(document.getElementById('conductivity')?.value) || null,

        // Биогены
        phosphates: parseFloat(document.getElementById('phosphates')?.value) || null,
        silicates: parseFloat(document.getElementById('silicates')?.value) || null,
        iron: parseFloat(document.getElementById('iron')?.value) || null,
        co2Dissolved: parseFloat(document.getElementById('co2Dissolved')?.value) || null,

        // Токсиканты
        copper: parseFloat(document.getElementById('copper')?.value) || null,
        lead: parseFloat(document.getElementById('lead')?.value) || null,
        chlorine: parseFloat(document.getElementById('chlorine')?.value) || null,
        chloramine: parseFloat(document.getElementById('chloramine')?.value) || null,

        // Специальные
        salinity: parseFloat(document.getElementById('salinity')?.value) || null,
        orp: parseFloat(document.getElementById('orp')?.value) || null,
        calcium: parseFloat(document.getElementById('calcium')?.value) || null,
        magnesium: parseFloat(document.getElementById('magnesium')?.value) || null
    };

    // Создаем детальный анализ
    let analysisHTML = `
        <div class="card featured">
            <h3>🔬 ПОЛНЫЙ НАУЧНЫЙ АНАЛИЗ ВОДЫ</h3>
            <div style="margin: 20px 0; padding: 15px; background: var(--light-color); border-radius: 8px;">
                <strong>Дата анализа:</strong> ${new Date().toLocaleString('ru-RU')}
            </div>
    `;

    // Анализируем каждую группу параметров
    analysisHTML += analyzeParameterGroup('Основные параметры', params, [
        {key: 'pH', name: 'pH', unit: '', optimal: [6.5, 7.5], acceptable: [6.0, 8.0]},
        {key: 'temperature', name: 'Температура', unit: '°C', optimal: [22, 28], acceptable: [18, 32]},
        {key: 'oxygen', name: 'Кислород', unit: 'мг/л', optimal: [6, 8], acceptable: [5, 12]}
    ]);

    analysisHTML += analyzeParameterGroup('Азотный цикл', params, [
        {key: 'ammonia', name: 'NH₃/NH₄', unit: 'мг/л', optimal: [0, 0.1], acceptable: [0, 0.25], critical: 0.5},
        {key: 'nitrites', name: 'NO₂', unit: 'мг/л', optimal: [0, 0.1], acceptable: [0, 0.25], critical: 0.5},
        {key: 'nitrates', name: 'NO₃', unit: 'мг/л', optimal: [5, 25], acceptable: [0, 50], critical: 100}
    ]);

    if (params.copper || params.lead || params.chlorine) {
        analysisHTML += analyzeParameterGroup('⚠️ Токсиканты', params, [
            {key: 'copper', name: 'Медь Cu', unit: 'мг/л', optimal: [0, 0.005], critical: 0.01},
            {key: 'lead', name: 'Свинец Pb', unit: 'мг/л', optimal: [0, 0.001], critical: 0.005},
            {key: 'chlorine', name: 'Хлор', unit: 'мг/л', optimal: [0, 0.01], critical: 0.1}
        ]);
    }

    // Добавляем рекомендации
    analysisHTML += generateRecommendations(params);

    analysisHTML += '</div>';

    // Сохраняем результат полного теста
    const fullTest = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'full',
        ...params
    };

    window.AkvaStorPro.userData.waterTests.push(fullTest);
    saveUserData();
    updateAllStats();

    const resultDiv = document.getElementById('fullAnalysisResult');
    if (resultDiv) {
        resultDiv.innerHTML = analysisHTML;
    }

    showToast('✅ Полный анализ завершен!', 'success');
}

function analyzeParameterGroup(groupName, params, paramConfig) {
    let groupHTML = `<h4>📊 ${groupName}</h4><div class="grid grid-3">`;

    paramConfig.forEach(config => {
        const value = params[config.key];
        if (value === null) return;

        let status = 'excellent';
        let statusText = '✅ Отлично';

        if (config.critical && value > config.critical) {
            status = 'danger';
            statusText = '❌ Критично';
        } else if (config.acceptable && (value < config.acceptable[0] || value > config.acceptable[1])) {
            status = 'warning';
            statusText = '⚠️ Не оптимально';
        } else if (config.optimal && (value < config.optimal[0] || value > config.optimal[1])) {
            status = 'good';
            statusText = '⚠️ Приемлемо';
        }

        groupHTML += `
            <div class="parameter-card">
                <div class="parameter-value">${value}${config.unit}</div>
                <div><strong>${config.name}</strong></div>
                <div class="test-result ${status}" style="margin-top: 10px; padding: 8px;">
                    ${statusText}
                </div>
            </div>
        `;
    });

    groupHTML += '</div>';
    return groupHTML;
}

function generateRecommendations(params) {
    let recommendations = [];

    if (params.ammonia > 0.1) {
        recommendations.push('🔄 Подмена воды 30-50% для снижения аммиака');
    }
    if (params.nitrites > 0.1) {
        recommendations.push('💨 Усильте аэрацию - нитриты блокируют кислород у рыб');
    }
    if (params.nitrates > 25) {
        recommendations.push('🌿 Увеличьте количество растений или частоту подмен');
    }
    if (params.pH < 6.5) {
        recommendations.push('⬆️ Повысьте pH добавлением соды или коралловой крошки');
    }
    if (params.pH > 7.5) {
        recommendations.push('⬇️ Понизьте pH торфом или корягами');
    }
    if (params.oxygen < 5) {
        recommendations.push('💨 НЕМЕДЛЕННО усильте аэрацию!');
    }
    if (params.copper > 0.005) {
        recommendations.push('⚠️ Медь токсична! Проверьте трубы и лекарства');
    }

    if (recommendations.length === 0) {
        recommendations.push('✅ Параметры в норме, продолжайте текущий уход');
    }

    return `
        <div style="margin: 25px 0;">
            <h4>💡 Персональные рекомендации</h4>
            <ul class="tips-list">
                ${recommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
    `;
}

// Очистка истории тестов
function clearWaterHistory() {
    if (!confirm('❓ Удалить ВСЮ историю тестирования воды? Это действие нельзя отменить.')) {
        return;
    }

    window.AkvaStorPro.userData.waterTests = [];
    saveUserData();
    updateAllStats();

    showToast('🗑️ История тестов очищена!', 'success');
}

// ============================================================================
// МОДУЛЬНЫЕ КАЛЬКУЛЯТОРЫ ОСВЕЩЕНИЯ
// ============================================================================

async function loadLightingCalculator() {
    if (!window.AkvaStorPro.calculators.lighting) {
        try {
            await loadScript('./calculators/lighting-calculator.js');
        } catch (error) {
            console.error('❌ Ошибка загрузки калькулятора освещения:', error);
        }
    }
}

function calculateScientificLighting() {
    const length = parseFloat(document.getElementById('lightCalcLength')?.value);
    const width = parseFloat(document.getElementById('lightCalcWidth')?.value);
    const height = parseFloat(document.getElementById('lightCalcHeight')?.value);
    const plantType = document.getElementById('lightCalcType')?.value;
    const fixtureType = document.getElementById('lightFixtureType')?.value;

    if (!length || !width || !height || !plantType) {
        showToast('⚠️ Заполните все поля калькулятора', 'warning');
        return;
    }

    // Площадь поверхности
    const surfaceArea = (length * width) / 10000; // см² в м²

    // Рекомендуемый PAR по типу растений
    const parRequirements = {
        none: {min: 0, max: 20, name: 'Только рыбы'},
        shade: {min: 30, max: 60, name: 'Теневыносливые растения'},
        medium: {min: 60, max: 120, name: 'Растения средних требований'},
        high: {min: 120, max: 200, name: 'Светолюбивые растения'},
        carpet: {min: 200, max: 300, name: 'Почвопокровные растения'}
    };

    const targetPAR = parRequirements[plantType];

    // Эффективность светильника (мкмоль/Дж)
    const efficiency = {
        led: 2.5,
        led_cheap: 1.8,
        t5: 1.6,
        t8: 1.2,
        mh: 1.3
    };

    const fixtureEfficiency = efficiency[fixtureType];

    // Поправки на высоту и потери
    const heightLoss = Math.max(0.5, 1 - (height - 30) * 0.02); // Потери с высотой
    const actualEfficiency = fixtureEfficiency * heightLoss;

    // Расчет требуемой мощности
    const minPowerNeeded = (targetPAR.min * surfaceArea) / actualEfficiency;
    const maxPowerNeeded = (targetPAR.max * surfaceArea) / actualEfficiency;

    // Фотопериод
    const recommendedPhotoperiod = plantType === 'none' ? 0 : 
                                  plantType === 'shade' ? 6 :
                                  plantType === 'carpet' ? 10 : 8;

    const resultHTML = `
        <div class="calc-result">
            <h5>💡 Научный расчет освещения</h5>

            <div class="parameter-card">
                <div class="parameter-value">${surfaceArea.toFixed(2)} м²</div>
                <div>Площадь поверхности</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${targetPAR.min}-${targetPAR.max} мкмоль/м²/с</div>
                <div>Рекомендуемый PAR</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${minPowerNeeded.toFixed(0)}-${maxPowerNeeded.toFixed(0)} Вт</div>
                <div>Требуемая мощность</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${recommendedPhotoperiod} часов</div>
                <div>Рекомендуемый фотопериод</div>
            </div>

            <h5>📊 Подробные рекомендации:</h5>
            <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Тип растений:</strong> ${targetPAR.name}</li>
                <li><strong>Светильник:</strong> ${fixtureType.toUpperCase()} (${fixtureEfficiency} мкмоль/Дж)</li>
                <li><strong>Высота подвеса:</strong> ${Math.round(height * 0.4)} см над водой</li>
                <li><strong>Коэффициент потерь:</strong> ${(100 - heightLoss * 100).toFixed(0)}%</li>
                <li><strong>Количество светильников:</strong> ${Math.ceil(maxPowerNeeded / 50)} шт по 50Вт</li>
            </ul>

            ${plantType !== 'none' ? `
                <div class="warning-card">
                    <h4>💡 Важно для растений:</h4>
                    <ul style="padding-left: 20px;">
                        <li>CO₂ система обязательна при PAR > 100</li>
                        <li>Удобрения NPK при интенсивном освещении</li>
                        <li>Постепенное увеличение интенсивности</li>
                        <li>Контроль водорослей первые 2-3 недели</li>
                    </ul>
                </div>
            ` : ''}
        </div>
    `;

    const resultDiv = document.getElementById('scientificLightResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }

    showToast('💡 Расчет освещения завершен!', 'success');
}

function calculateDLI() {
    const par = parseFloat(document.getElementById('dliPAR')?.value);
    const photoperiod = parseFloat(document.getElementById('dliPhotoperiod')?.value);
    const waterLoss = parseFloat(document.getElementById('waterAttenuation')?.value) || 10;
    const shadingLoss = parseFloat(document.getElementById('shadingLoss')?.value) || 15;

    if (!par || !photoperiod) {
        showToast('⚠️ Введите PAR и фотопериод', 'warning');
        return;
    }

    // Расчет DLI с учетом потерь
    const actualPAR = par * (1 - waterLoss / 100) * (1 - shadingLoss / 100);
    const dli = (actualPAR * photoperiod * 3600) / 1000000; // моль/м²/день

    // Оценка уровня освещения
    let lightLevel = 'Низкое';
    let recommendation = '';

    if (dli < 15) {
        lightLevel = 'Низкое (теневыносливые)';
        recommendation = 'Подходит для анубиасов, мхов, папоротников';
    } else if (dli < 30) {
        lightLevel = 'Среднее (большинство растений)';
        recommendation = 'Универальный уровень для травника';
    } else if (dli < 50) {
        lightLevel = 'Высокое (светолюбивые)';
        recommendation = 'Требуется CO₂ и удобрения!';
    } else {
        lightLevel = 'Очень высокое';
        recommendation = 'Риск водорослей! Снизьте интенсивность';
    }

    const resultHTML = `
        <div class="calc-result">
            <h5>☀️ Daily Light Integral (DLI)</h5>

            <div class="parameter-card">
                <div class="parameter-value">${dli.toFixed(1)} моль/м²/день</div>
                <div>DLI с учетом потерь</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${actualPAR.toFixed(0)} мкмоль/м²/с</div>
                <div>Фактический PAR</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${lightLevel}</div>
                <div>Уровень освещения</div>
            </div>

            <div style="margin: 15px 0; padding: 15px; background: var(--light-color); border-radius: 8px;">
                <strong>💡 Рекомендация:</strong> ${recommendation}
            </div>

            <h5>📊 Потери света:</h5>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li>Вода: -${waterLoss}% (${(par * waterLoss / 100).toFixed(0)} мкмоль/м²/с)</li>
                <li>Затенение: -${shadingLoss}% (${(par * shadingLoss / 100).toFixed(0)} мкмоль/м²/с)</li>
                <li>Итоговые потери: -${(100 - (actualPAR / par * 100)).toFixed(0)}%</li>
            </ul>
        </div>
    `;

    const resultDiv = document.getElementById('dliResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }

    showToast('☀️ DLI рассчитан!', 'success');
}

function analyzeColorTemperature() {
    const temp = parseInt(document.getElementById('colorTemperature')?.value);

    if (!temp) return;

    let analysis = '';
    let plantEffect = '';
    let fishEffect = '';
    let algaeRisk = '';

    switch (temp) {
        case 2700:
            analysis = 'Очень теплый белый свет';
            plantEffect = 'Способствует цветению, но недостаточен для фотосинтеза';
            fishEffect = 'Подчеркивает красные и желтые оттенки рыб';
            algaeRisk = 'Низкий риск водорослей';
            break;
        case 4000:
            analysis = 'Нейтрально-белый свет';
            plantEffect = 'Подходит для неприхотливых растений';
            fishEffect = 'Естественная передача цветов';
            algaeRisk = 'Средний риск водорослей';
            break;
        case 6500:
            analysis = 'Дневной свет - ОПТИМУМ';
            plantEffect = 'Максимальная эффективность фотосинтеза';
            fishEffect = 'Яркие натуральные цвета';
            algaeRisk = 'Контролируемый риск при балансе';
            break;
        case 8000:
            analysis = 'Холодный белый свет';
            plantEffect = 'Стимулирует компактный рост';
            fishEffect = 'Подчеркивает синие оттенки';
            algaeRisk = 'Повышенный риск сине-зеленых';
            break;
        case 10000:
            analysis = 'Очень холодный свет';
            plantEffect = 'Только в комбинации с теплым';
            fishEffect = 'Неестественные оттенки';
            algaeRisk = 'Высокий риск диатомовых';
            break;
    }

    const resultHTML = `
        <div class="calc-result">
            <h5>🌡️ Анализ цветовой температуры ${temp}K</h5>

            <div class="parameter-card">
                <div class="parameter-value">${analysis}</div>
                <div>Характеристика света</div>
            </div>

            <div style="margin: 20px 0;">
                <h5>🌿 Влияние на растения:</h5>
                <p>${plantEffect}</p>

                <h5>🐠 Влияние на рыб:</h5>
                <p>${fishEffect}</p>

                <h5>🦠 Риск водорослей:</h5>
                <p>${algaeRisk}</p>
            </div>

            <div class="info-card">
                <h4>💡 Профессиональная рекомендация:</h4>
                <p>Оптимальная комбинация: 70% света 6500K + 30% света 3000K для естественного спектра с высокой эффективностью фотосинтеза.</p>
            </div>
        </div>
    `;

    const resultDiv = document.getElementById('colorTempResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }
}

// ============================================================================
// МОДУЛЬНЫЕ КАЛЬКУЛЯТОРЫ БИОЗАГРУЗКИ
// ============================================================================

function calculateBioload() {
    const fishBiomass = parseFloat(document.getElementById('fishBiomass')?.value);
    const dailyFood = parseFloat(document.getElementById('dailyFood')?.value);
    const volume = parseFloat(document.getElementById('bioloadVolume')?.value);
    const temp = parseFloat(document.getElementById('bioloadTemp')?.value) || 25;

    if (!fishBiomass || !volume) {
        showToast('⚠️ Введите массу рыб и объем аквариума', 'warning');
        return;
    }

    // Расчет выделения аммиака (по Spotte, 1979)
    const nh3FromFish = fishBiomass * 0.025; // 25 мг NH3-N на 100г рыбы в сутки
    const nh3FromFood = (dailyFood || 0) * 0.08; // 8% от корма превращается в NH3-N
    const totalNH3 = nh3FromFish + nh3FromFood;

    // Биозагрузка на литр
    const bioloadPerLiter = totalNH3 / volume;

    // Температурный коэффициент
    const tempFactor = Math.pow(1.08, (temp - 20)); // Q10 = 2.0 для метаболизма

    const adjustedBioload = bioloadPerLiter * tempFactor;

    // Оценка биозагрузки
    let bioloadStatus = 'excellent';
    let statusText = '✅ Низкая биозагрузка';
    let recommendation = 'Биозагрузка в норме';

    if (adjustedBioload > 1.0) {
        bioloadStatus = 'danger';
        statusText = '❌ Критическая биозагрузка';
        recommendation = 'Уменьшите количество рыб или увеличьте фильтрацию!';
    } else if (adjustedBioload > 0.5) {
        bioloadStatus = 'warning';
        statusText = '⚠️ Высокая биозагрузка';
        recommendation = 'Усильте фильтрацию, увеличьте подмены';
    } else if (adjustedBioload > 0.25) {
        bioloadStatus = 'good';
        statusText = '✅ Умеренная биозагрузка';
        recommendation = 'Стандартное обслуживание достаточно';
    }

    // Требуемая производительность фильтра
    const requiredFlow = volume * 5; // 5 оборотов в час для высокой биозагрузки
    const requiredBioSurface = totalNH3 * 200; // 200 см² на 1 мг NH3-N в сутки

    const resultHTML = `
        <div class="calc-result">
            <h5>⚖️ Анализ биозагрузки аквариума</h5>

            <div class="parameter-card">
                <div class="parameter-value">${totalNH3.toFixed(2)} мг/сутки</div>
                <div>Выделение NH₃-N</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${adjustedBioload.toFixed(3)} мг/л/сут</div>
                <div>Биозагрузка с учетом T°</div>
            </div>

            <div class="test-result ${bioloadStatus}">
                <strong>${statusText}</strong><br>
                ${recommendation}
            </div>

            <h5>🔧 Требования к оборудованию:</h5>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>Фильтр:</strong> ≥${requiredFlow} л/ч (${(requiredFlow/volume).toFixed(1)} оборотов)</li>
                <li><strong>Биозагрузка:</strong> ≥${requiredBioSurface.toFixed(0)} см² поверхности</li>
                <li><strong>Подмены воды:</strong> ${adjustedBioload > 0.5 ? '2-3 раза в неделю по 25%' : 'раз в неделю 20%'}</li>
                <li><strong>Аэрация:</strong> ${adjustedBioload > 0.3 ? 'Круглосуточная' : 'По потребности'}</li>
            </ul>

            <div style="font-size: 12px; color: #666; margin-top: 15px;">
                Расчет по методике Spotte S. "Fish and Invertebrate Culture" (1979)<br>
                Температурная коррекция: Q₁₀ = 2.0 для биологических процессов
            </div>
        </div>
    `;

    const resultDiv = document.getElementById('bioloadResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }

    // Автоматически заполняем поле NH3 в других калькуляторах
    const nh3Input = document.getElementById('nh3Production');
    if (nh3Input) {
        nh3Input.value = totalNH3.toFixed(2);
        calculateOxygenConsumption();
    }
}

function calculateMaturation() {
    const temp = parseFloat(document.getElementById('maturationTemp')?.value) || 25;
    const pH = parseFloat(document.getElementById('maturationPH')?.value) || 7.5;
    const starter = document.getElementById('starterBacteria')?.value || 'no';
    const surface = parseFloat(document.getElementById('biofilterSurface')?.value) || 5000;

    // Базовое время созревания при 25°C и pH 7.5
    let baseDays = 28;

    // Температурная коррекция (Q10 = 2.3 для нитрификаторов)
    const tempFactor = Math.pow(2.3, (temp - 25) / 10);

    // pH коррекция (оптимум 7.5-8.0)
    let pHFactor = 1.0;
    if (pH < 7.0) pHFactor = 1.5;
    else if (pH < 7.5) pHFactor = 1.2;
    else if (pH > 8.5) pHFactor = 1.3;

    // Коррекция на стартовые бактерии
    let starterFactor = 1.0;
    if (starter === 'yes') starterFactor = 0.6; // Коммерческие бактерии
    if (starter === 'seeded') starterFactor = 0.3; // Биозагрузка из старого фильтра

    const actualDays = (baseDays / tempFactor / starterFactor) * pHFactor;

    // Фазы созревания
    const phase1 = Math.round(actualDays * 0.1); // Подготовительная
    const phase2 = Math.round(actualDays * 0.4); // Рост Nitrosomonas
    const phase3 = Math.round(actualDays * 0.3); // Рост Nitrobacter
    const phase4 = Math.round(actualDays * 0.2); // Стабилизация

    // Требуемая площадь биозагрузки
    const recommendedSurface = 10000; // см² на 100л
    const surfaceRatio = surface / recommendedSurface;

    let surfaceStatus = 'excellent';
    if (surfaceRatio < 0.5) surfaceStatus = 'danger';
    else if (surfaceRatio < 0.8) surfaceStatus = 'warning';

    const resultHTML = `
        <div class="calc-result">
            <h5>⏱️ Прогноз созревания биофильтра</h5>

            <div class="parameter-card">
                <div class="parameter-value">${Math.round(actualDays)} дней</div>
                <div>Общее время созревания</div>
            </div>

            <h5>📊 Фазы созревания:</h5>
            <div class="grid grid-4" style="margin: 15px 0;">
                <div class="parameter-card">
                    <div class="parameter-value">1-${phase1}</div>
                    <div>Подготовка</div>
                </div>
                <div class="parameter-card">
                    <div class="parameter-value">${phase1+1}-${phase1+phase2}</div>
                    <div>Пик NH₃</div>
                </div>
                <div class="parameter-card">
                    <div class="parameter-value">${phase1+phase2+1}-${phase1+phase2+phase3}</div>
                    <div>Пик NO₂</div>
                </div>
                <div class="parameter-card">
                    <div class="parameter-value">${phase1+phase2+phase3+1}-${actualDays.toFixed(0)}</div>
                    <div>Готовность</div>
                </div>
            </div>

            <div class="test-result ${surfaceStatus}">
                <strong>Биозагрузка: ${surface.toLocaleString()} см²</strong><br>
                ${surfaceStatus === 'excellent' ? '✅ Достаточная площадь' :
                  surfaceStatus === 'warning' ? '⚠️ Маловато, добавьте биозагрузку' :
                  '❌ Критически мало! Увеличьте в 2 раза'}
            </div>

            <h5>🔬 Факторы влияния:</h5>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>Температура ${temp}°C:</strong> ${tempFactor > 1 ? 'ускоряет' : 'замедляет'} в ${tempFactor.toFixed(1)}x</li>
                <li><strong>pH ${pH}:</strong> ${pHFactor === 1.0 ? 'оптимальный' : 'замедляет в ' + pHFactor.toFixed(1) + 'x'}</li>
                <li><strong>Стартовые бактерии:</strong> ${starter === 'no' ? 'не используются' : 'ускоряют в ' + (1/starterFactor).toFixed(1) + 'x'}</li>
            </ul>

            <div class="warning-card">
                <h4>⚠️ Важно помнить:</h4>
                <ul style="padding-left: 20px;">
                    <li>НЕ добавляйте рыб до полной готовности</li>
                    <li>НЕ промывайте биозагрузку первые 6 недель</li>
                    <li>Тестируйте воду каждые 2-3 дня</li>
                    <li>Поддерживайте стабильную температуру</li>
                </ul>
            </div>
        </div>
    `;

    const resultDiv = document.getElementById('maturationResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }

    showToast('⏱️ Прогноз созревания готов!', 'success');
}

function calculateOxygenConsumption() {
    const nh3Production = parseFloat(document.getElementById('nh3Production')?.value);
    const efficiency = parseFloat(document.getElementById('nitrificationEfficiency')?.value) || 85;

    if (!nh3Production) {
        showToast('⚠️ Введите количество NH₃-N', 'warning');
        return;
    }

    // Научные коэффициенты потребления кислорода (Wheaton, 1977)
    const o2ForNH3 = 4.57; // мг O₂ на 1 мг NH₃-N
    const o2ForNO2 = 1.14; // мг O₂ на 1 мг NO₂-N

    const effectiveNH3 = nh3Production * (efficiency / 100);
    const o2Consumption = effectiveNH3 * o2ForNH3; // Полное окисление NH₃→NO₃

    // Потребление кислорода в час
    const o2PerHour = o2Consumption / 24;
    const o2PerMinute = o2PerHour / 60;

    // Оценка нагрузки на аэрацию
    let aeration = 'низкая';
    let compressorPower = '5-10 л/мин';

    if (o2PerHour > 100) {
        aeration = 'очень высокая';
        compressorPower = '50+ л/мин + дополнительная аэрация';
    } else if (o2PerHour > 50) {
        aeration = 'высокая';
        compressorPower = '20-30 л/мин';
    } else if (o2PerHour > 20) {
        aeration = 'умеренная';
        compressorPower = '10-15 л/мин';
    }

    const resultHTML = `
        <div class="calc-result">
            <h5>💨 Потребление кислорода при нитрификации</h5>

            <div class="parameter-card">
                <div class="parameter-value">${o2Consumption.toFixed(1)} мг/сут</div>
                <div>Общее потребление O₂</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${o2PerHour.toFixed(2)} мг/час</div>
                <div>Потребление O₂ в час</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${aeration}</div>
                <div>Нагрузка на аэрацию</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${compressorPower}</div>
                <div>Требуемый компрессор</div>
            </div>

            <h5>🔬 Научное обоснование:</h5>
            <div style="font-family: monospace; background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #ddd;">
                NH₃ + 2O₂ → NO₃⁻ + H⁺ + H₂O<br>
                Стехиометрия: 1 мг NH₃-N = 4.57 мг O₂<br>
                Эффективность нитрификации: ${efficiency}%
            </div>

            <div class="warning-card">
                <h4>⚠️ Критически важно:</h4>
                <ul style="padding-left: 20px;">
                    <li>Растворенный O₂ должен быть >4 мг/л постоянно</li>
                    <li>При недостатке кислорода нитрификация останавливается</li>
                    <li>Анаэробные зоны могут вызвать денитрификацию</li>
                    <li>Ночью потребление кислорода максимальное</li>
                </ul>
            </div>
        </div>
    `;

    const resultDiv = document.getElementById('oxygenConsumptionResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }
}

function calculateBiofilterArea() {
    const nh3Load = parseFloat(document.getElementById('nh3Load')?.value);
    const mediaType = document.getElementById('biomediaType')?.value;
    const flowRate = parseFloat(document.getElementById('flowRate')?.value);

    if (!nh3Load || !flowRate) {
        showToast('⚠️ Заполните все поля калькулятора', 'warning');
        return;
    }

    // Удельная площадь различных биозагрузок (м²/м³)
    const specificSurface = {
        ceramic: 600,        // Керамические кольца
        bio_balls: 500,      // Биошары
        sintered_glass: 1000, // Спеченное стекло
        lava_rock: 300,      // Лавовая крошка
        plastic_media: 400,   // Пластиковые наполнители
        sponge: 800          // Поролоновые губки
    };

    // Скорость нитрификации (кг NH₃-N/м²/сутки)
    const nitrificationRate = 0.001; // Консервативная оценка для аквариумов

    // Требуемая площадь
    const requiredArea = (nh3Load / 1000) / nitrificationRate; // м²
    const requiredAreaCm2 = requiredArea * 10000; // см²

    // Объем биозагрузки
    const mediaVolume = requiredArea / (specificSurface[mediaType] / 1000); // м³
    const mediaVolumeLiters = mediaVolume * 1000; // л

    // Время контакта (критично для эффективности)
    const contactTime = (mediaVolumeLiters / flowRate) * 60; // минуты

    let contactStatus = 'excellent';
    let contactRecommendation = '';

    if (contactTime < 2) {
        contactStatus = 'danger';
        contactRecommendation = 'Слишком быстрый поток! Уменьшите производительность';
    } else if (contactTime < 5) {
        contactStatus = 'warning';
        contactRecommendation = 'Контакт маловат, желательно больше биозагрузки';
    } else {
        contactRecommendation = 'Время контакта достаточное';
    }

    const mediaNames = {
        ceramic: 'Керамические кольца',
        bio_balls: 'Биошары',
        sintered_glass: 'Спеченное стекло',
        lava_rock: 'Лавовая крошка',
        plastic_media: 'Пластиковые наполнители',
        sponge: 'Поролоновые губки'
    };

    const resultHTML = `
        <div class="calc-result">
            <h5>📏 Расчет площади биофильтра</h5>

            <div class="parameter-card">
                <div class="parameter-value">${requiredAreaCm2.toFixed(0)} см²</div>
                <div>Требуемая площадь</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${mediaVolumeLiters.toFixed(1)} л</div>
                <div>Объем ${mediaNames[mediaType].toLowerCase()}</div>
            </div>

            <div class="parameter-card">
                <div class="parameter-value">${contactTime.toFixed(1)} минут</div>
                <div>Время контакта</div>
            </div>

            <div class="test-result ${contactStatus}">
                <strong>Эффективность контакта</strong><br>
                ${contactRecommendation}
            </div>

            <h5>📊 Характеристики биозагрузки:</h5>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>Тип:</strong> ${mediaNames[mediaType]}</li>
                <li><strong>Удельная площадь:</strong> ${specificSurface[mediaType]} м²/м³</li>
                <li><strong>Производительность:</strong> ${(nh3Load * 365 / 1000).toFixed(1)} кг NH₃-N/год</li>
                <li><strong>Расход через фильтр:</strong> ${flowRate} л/ч</li>
            </ul>

            <div class="info-card">
                <h4>🔧 Практические рекомендации:</h4>
                <ul style="padding-left: 20px;">
                    <li>Разместите биозагрузку в последней камере фильтра</li>
                    <li>Обеспечьте равномерное распределение потока</li>
                    <li>Не промывайте биозагрузку чаще раза в месяц</li>
                    <li>При промывке используйте только аквариумную воду</li>
                </ul>
            </div>
        </div>
    `;

    const resultDiv = document.getElementById('biofilterAreaResult');
    if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
    }

    showToast('📏 Расчет биофильтра завершен!', 'success');
}

// ============================================================================
// ОБНОВЛЕНИЕ UI ЭЛЕМЕНТОВ
// ============================================================================

function updateAllStats() {
    const userData = window.AkvaStorPro.userData;

    // Основная статистика
    updateStatElement('totalPhotos', userData.photos?.length || 0);
    updateStatElement('totalNotes', userData.notes?.length || 0);  
    updateStatElement('totalTests', userData.waterTests?.length || 0);
    updateStatElement('totalFish', userData.myFish?.length || 0);
    updateStatElement('totalPlants', userData.myPlants?.length || 0);

    // Возраст аквариума
    if (userData.aquarium?.startDate) {
        const start = new Date(userData.aquarium.startDate);
        const today = new Date();
        const diffTime = Math.abs(today - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        updateStatElement('aquariumAge', diffDays);
    }

    // Обновляем специфичные разделы
    updatePhotoGallery();
    updateNotesList(); 
    updateTasksList();
    updateLastWaterTest();
    updateNotesStats();
    updateWaterTestStats();
}

function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function updatePhotoGallery() {
    const gallery = document.getElementById('photoGallery');
    const stats = document.getElementById('photoStats');

    if (!gallery) return;

    const photos = window.AkvaStorPro.userData.photos || [];

    if (photos.length === 0) {
        gallery.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Фотографии не добавлены</p>';
        if (stats) stats.style.display = 'none';
        return;
    }

    let galleryHTML = '';
    let totalSize = 0;

    photos.forEach(photo => {
        totalSize += photo.size || 0;
        galleryHTML += `
            <div class="photo-item">
                <img src="${photo.data}" alt="${photo.name}" onclick="showPhotoModal('${photo.data}', '${photo.name}')">
                <button class="photo-delete" onclick="deletePhoto(${photo.id})" title="Удалить фото">×</button>
            </div>
        `;
    });

    gallery.innerHTML = galleryHTML;

    // Обновляем статистику
    if (stats) {
        document.getElementById('photoCount').textContent = photos.length;
        document.getElementById('photoSize').textContent = (totalSize / 1024 / 1024).toFixed(1);
        document.getElementById('lastPhoto').textContent = photos.length > 0 ? 
            new Date(photos[photos.length - 1].date).toLocaleDateString('ru-RU') : '-';
        stats.style.display = 'block';
    }
}

function updateNotesList() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;

    const notes = window.AkvaStorPro.userData.notes || [];

    if (notes.length === 0) {
        notesList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Заметки не добавлены</p>';
        return;
    }

    let notesHTML = '';
    notes.slice().reverse().forEach(note => { // Показываем новые первыми
        const date = new Date(note.date).toLocaleString('ru-RU');
        notesHTML += `
            <div class="note-item">
                <div class="note-date">${date}</div>
                <div class="note-text">${note.text}</div>
                <button class="note-delete" onclick="deleteNote(${note.id})" title="Удалить заметку">×</button>
            </div>
        `;
    });

    notesList.innerHTML = notesHTML;
}

function updateTasksList() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;

    const tasks = window.AkvaStorPro.userData.tasks || [];

    if (tasks.length === 0) {
        tasksList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Задач нет</p>';
        return;
    }

    let tasksHTML = '';
    tasks.forEach(task => {
        const date = new Date(task.date).toLocaleString('ru-RU');
        const isOverdue = new Date(task.date) < new Date();

        tasksHTML += `
            <div class="note-item ${isOverdue ? 'overdue' : ''}">
                <div class="note-date">${date} ${isOverdue ? '⏰ Просрочено' : ''}</div>
                <div class="note-text">${task.text}</div>
                <button class="note-delete" onclick="deleteTask(${task.id})" title="Удалить задачу">×</button>
            </div>
        `;
    });

    tasksList.innerHTML = tasksHTML;
}

function updateLastWaterTest() {
    const lastTestDiv = document.getElementById('lastWaterTest');
    if (!lastTestDiv) return;

    const tests = window.AkvaStorPro.userData.waterTests || [];

    if (tests.length === 0) {
        lastTestDiv.innerHTML = `
            <div style='text-align: center; padding: 40px; color: #666;'>
                <div style='font-size: 3rem; margin-bottom: 15px;'>🧪</div>
                <p>Параметры воды еще не тестировались</p>
                <button class='btn btn-primary' onclick='document.querySelector("[data-section=\\'water-analysis\\']").click();'>
                    🔬 Провести анализ воды
                </button>
            </div>
        `;
        return;
    }

    const lastTest = tests[tests.length - 1];
    const testDate = new Date(lastTest.date).toLocaleString('ru-RU');

    let parametersHTML = '';
    if (lastTest.pH) parametersHTML += `<div><strong>pH:</strong> ${lastTest.pH}</div>`;
    if (lastTest.temperature) parametersHTML += `<div><strong>Температура:</strong> ${lastTest.temperature}°C</div>`;
    if (lastTest.ammonia !== null) parametersHTML += `<div><strong>NH₃/NH₄:</strong> ${lastTest.ammonia} мг/л</div>`;
    if (lastTest.nitrites !== null) parametersHTML += `<div><strong>NO₂:</strong> ${lastTest.nitrites} мг/л</div>`;
    if (lastTest.nitrates !== null) parametersHTML += `<div><strong>NO₃:</strong> ${lastTest.nitrates} мг/л</div>`;

    lastTestDiv.innerHTML = `
        <div>
            <h4>📊 Последний тест: ${testDate}</h4>
            <div class="grid grid-3" style="margin: 15px 0;">
                ${parametersHTML}
            </div>
            <button class='btn btn-secondary' onclick='document.querySelector("[data-section=\\'water-analysis\\']").click();'>
                🔬 Новый анализ
            </button>
        </div>
    `;
}

function updateNotesStats() {
    const notesStats = document.getElementById('notesStats');
    if (!notesStats) return;

    const notes = window.AkvaStorPro.userData.notes || [];

    if (notes.length === 0) {
        notesStats.style.display = 'none';
        return;
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const notesThisWeek = notes.filter(note => new Date(note.date) > weekAgo).length;
    const notesThisMonth = notes.filter(note => new Date(note.date) > monthAgo).length;
    const averageLength = Math.round(notes.reduce((sum, note) => sum + note.text.length, 0) / notes.length);

    updateStatElement('notesThisWeek', notesThisWeek);
    updateStatElement('notesThisMonth', notesThisMonth);
    updateStatElement('averageNoteLength', averageLength);

    notesStats.style.display = 'block';
}

function updateWaterTestStats() {
    const tests = window.AkvaStorPro.userData.waterTests || [];

    if (tests.length === 0) {
        updateStatElement('avgPH', '-');
        updateStatElement('avgTemp', '-');
        updateStatElement('maxAmmonia', '-');
        updateStatElement('testsCount', '0');
        updateStatElement('lastTestDays', '-');
        updateStatElement('testsThisMonth', '0');
        return;
    }

    // Средние значения
    const phValues = tests.filter(t => t.pH).map(t => t.pH);
    const tempValues = tests.filter(t => t.temperature).map(t => t.temperature);
    const ammoniaValues = tests.filter(t => t.ammonia !== null).map(t => t.ammonia);

    const avgPH = phValues.length > 0 ? (phValues.reduce((a, b) => a + b) / phValues.length).toFixed(1) : '-';
    const avgTemp = tempValues.length > 0 ? (tempValues.reduce((a, b) => a + b) / tempValues.length).toFixed(1) : '-';
    const maxAmmonia = ammoniaValues.length > 0 ? Math.max(...ammoniaValues).toFixed(2) : '-';

    // Дней с последнего теста
    const lastTest = new Date(tests[tests.length - 1].date);
    const daysSince = Math.floor((new Date() - lastTest) / (1000 * 60 * 60 * 24));

    // Тесты за месяц
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const testsThisMonth = tests.filter(t => new Date(t.date) > monthAgo).length;

    updateStatElement('avgPH', avgPH);
    updateStatElement('avgTemp', avgTemp);
    updateStatElement('maxAmmonia', maxAmmonia);
    updateStatElement('testsCount', tests.length);
    updateStatElement('lastTestDays', daysSince);
    updateStatElement('testsThisMonth', testsThisMonth);
}

// ============================================================================
// СИСТЕМНАЯ ПОДПИСКА И PWA
// ============================================================================

function initializeSubscription() {
    const savedSubscription = localStorage.getItem('akvastor_subscription') || 'free';

    // Проверяем статус подписки
    if (savedSubscription === 'trial') {
        const trialEnd = localStorage.getItem('akvastor_trial_end');
        if (trialEnd && new Date() > new Date(trialEnd)) {
            updateSubscriptionStatus('free');
            showToast('⏰ Пробный период истек', 'warning');
        } else {
            updateSubscriptionStatus('trial');
        }
    } else {
        updateSubscriptionStatus(savedSubscription);
    }

    console.log(`🔐 Подписка инициализирована: ${window.AkvaStorPro.subscription.status}`);
}

function updateSubscriptionStatus(status) {
    window.AkvaStorPro.subscription.status = status;
    window.AkvaStorPro.subscription.isPro = status === 'pro' || status === 'trial';

    // Глобальная переменная для совместимости
    window.hasPROSubscription = window.AkvaStorPro.subscription.isPro;

    // Обновляем UI подписки
    updateSubscriptionUI(status);

    localStorage.setItem('akvastor_subscription', status);
}

function updateSubscriptionUI(status) {
    const statusElement = document.getElementById('subscriptionStatus');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const trialBtn = document.getElementById('trialBtn');

    if (!statusElement) return;

    switch(status) {
        case 'pro':
            statusElement.textContent = 'PRO АКТИВЕН';
            statusElement.className = 'subscription-status pro';
            if (subscribeBtn) subscribeBtn.style.display = 'none';
            if (trialBtn) trialBtn.style.display = 'none';
            unlockPROFeatures();
            break;

        case 'trial':
            statusElement.textContent = 'ПРОБНЫЙ ПЕРИОД';
            statusElement.className = 'subscription-status trial';
            if (subscribeBtn) subscribeBtn.textContent = '🚀 Купить PRO';
            if (trialBtn) trialBtn.style.display = 'none';
            unlockPROFeatures();
            break;

        default:
            statusElement.textContent = 'БЕСПЛАТНО';
            statusElement.className = 'subscription-status free';
            if (subscribeBtn) subscribeBtn.style.display = 'inline-block';
            if (trialBtn) trialBtn.style.display = 'inline-block';
            lockPROFeatures();
    }
}

function unlockPROFeatures() {
    // Разблокируем PRO кнопки в навигации
    document.querySelectorAll('.nav-btn.pro-locked').forEach(btn => {
        btn.classList.remove('pro-locked');
        const badge = btn.querySelector('.pro-badge');
        if (badge) badge.remove();
    });

    // Разблокируем PRO контент
    document.querySelectorAll('.pro-feature, .pro-only').forEach(element => {
        element.classList.remove('locked');
    });

    console.log('🔓 PRO функции разблокированы');
}

function lockPROFeatures() {
    // Блокируем PRO кнопки
    const proSections = ['fish-compatibility', 'plant-compatibility', 'calculators', 'aquascaping'];
    proSections.forEach(sectionId => {
        const btn = document.querySelector(`[data-section="${sectionId}"]`);
        if (btn && !btn.classList.contains('pro-locked')) {
            btn.classList.add('pro-locked');
            if (!btn.querySelector('.pro-badge')) {
                btn.innerHTML += ' <span class="pro-badge">PRO</span>';
            }
        }
    });

    console.log('🔒 PRO функции заблокированы');
}

function initializePWA() {
    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('✅ Service Worker зарегистрирован');
            })
            .catch(error => {
                console.log('❌ Ошибка Service Worker:', error);
            });
    }

    // Install prompt  
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'block';
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                showToast('ℹ️ Приложение уже установлено', 'info');
                return;
            }

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                showToast('✅ Приложение установлено!', 'success');
                installBtn.style.display = 'none';
            }

            deferredPrompt = null;
        });
    }

    // Push уведомления
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', requestNotificationPermission);
    }
}

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('❌ Уведомления не поддерживаются', 'error');
        return;
    }

    if (Notification.permission === 'granted') {
        showToast('✅ Уведомления уже включены', 'success');
        new Notification('🐠 АкваСбор PRO', {
            body: 'Уведомления работают!',
            icon: './icons/icon-192.png'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('✅ Уведомления включены!', 'success');
                new Notification('🐠 АкваСбор PRO', {
                    body: 'Добро пожаловать!',
                    icon: './icons/icon-192.png'
                });
            }
        });
    }
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

// Показать toast уведомление
function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, type === 'error' ? 5000 : 3000);
}

// Загрузка скрипта
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Удаление заметки
function deleteNote(noteId) {
    if (!confirm('❓ Удалить заметку?')) return;

    window.AkvaStorPro.userData.notes = window.AkvaStorPro.userData.notes.filter(note => note.id !== noteId);
    saveUserData();
    updateNotesList();
    updateAllStats();

    showToast('🗑️ Заметка удалена', 'success');
}

// Удаление фото
function deletePhoto(photoId) {
    if (!confirm('❓ Удалить фотографию?')) return;

    window.AkvaStorPro.userData.photos = window.AkvaStorPro.userData.photos.filter(photo => photo.id !== photoId);
    saveUserData();
    updatePhotoGallery();
    updateAllStats();

    showToast('🗑️ Фото удалено', 'success');
}

// Удаление задачи
function deleteTask(taskId) {
    window.AkvaStorPro.userData.tasks = window.AkvaStorPro.userData.tasks.filter(task => task.id !== taskId);
    saveUserData();
    updateTasksList();
    updateAllStats();

    showToast('✅ Задача удалена', 'success');
}

// Показ фото в модальном окне
function showPhotoModal(photoData, photoName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class='modal-content' style='max-width: 90%; max-height: 90%; padding: 20px;'>
            <button class='modal-close' onclick='this.closest(".modal-overlay").remove()'>×</button>
            <h3>📸 ${photoName}</h3>
            <div style='text-align: center; margin: 20px 0;'>
                <img src='${photoData}' style='max-width: 100%; max-height: 70vh; object-fit: contain;'>
            </div>
            <div style='text-align: center;'>
                <button class='btn btn-secondary' onclick='downloadPhoto("${photoData}", "${photoName}")'>📥 Скачать</button>
            </div>
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}

function downloadPhoto(photoData, photoName) {
    const a = document.createElement('a');
    a.href = photoData;
    a.download = photoName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ============================================================================
// ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ ДЛЯ HTML
// ============================================================================

// Аквариум
window.saveAquariumParams = saveAquariumParams;
window.calculateAquariumStats = calculateAquariumStats;
window.exportAquariumData = exportAquariumData;

// Фото
window.takePhoto = takePhoto;
window.capturePhoto = capturePhoto;
window.stopCamera = stopCamera;
window.exportPhotos = exportPhotos;
window.clearAllPhotos = clearAllPhotos;
window.deletePhoto = deletePhoto;
window.showPhotoModal = showPhotoModal;
window.downloadPhoto = downloadPhoto;

// Заметки
window.addQuickNote = addQuickNote;
window.exportNotes = exportNotes;
window.searchNotes = searchNotes;
window.deleteNote = deleteNote;

// Анализ воды
window.performQuickTest = performQuickTest;
window.clearQuickTest = clearQuickTest;
window.loadLastTest = loadLastTest;
window.calculateAmmoniaToxicity = calculateAmmoniaToxicity;
window.analyzeAllParameters = analyzeAllParameters;
window.clearWaterHistory = clearWaterHistory;

// Калькуляторы освещения
window.calculateScientificLighting = calculateScientificLighting;
window.calculateDLI = calculateDLI;
window.analyzeColorTemperature = analyzeColorTemperature;

// Калькуляторы биозагрузки
window.calculateBioload = calculateBioload;
window.calculateMaturation = calculateMaturation;
window.calculateOxygenConsumption = calculateOxygenConsumption;
window.calculateBiofilterArea = calculateBiofilterArea;

// Подписка
window.showSubscriptionModal = showSubscriptionModal;
window.startTrial = startTrial;
window.startPayment = startPayment;

// Утилиты
window.showToast = showToast;
window.updateAllStats = updateAllStats;
window.loadDatabases = loadDatabases;
window.deleteTask = deleteTask;

console.log('✅ АкваСбор PRO v3.1 - ВСЕ ФУНКЦИИ ЗАГРУЖЕНЫ И ГОТОВЫ К РАБОТЕ!');
