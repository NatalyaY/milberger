# Сайт-визитка с самописной CMS (Frontend + Backend, MongoDB) [(live version)](https://milberger.fantasia18.repl.co/)
Сайт для компании по дизайнерскому ремонту с простой системой управления контентом (статьи, выполненные проекты), заявками с сайта и самописным текстовым редактором. 
Vanilla JS, Express server, MongoDB Atlas, SCCS, Webpack.    
Использованы подходы **CSR** (статьи, проекты на сайте) и **SSR** (разделы CMS). Написан серверный REST API.    
Проект выполнен без использования сторонних библиотек.
## Что интересного:   
**Сайт:**    
:white_check_mark: кастомные галереи (слайд-шоу) с нестандартным расположением элементов    
:white_check_mark: кастомная реализация якорей для навигации по странице     
:white_check_mark: видео с помощью YouTube API с кастомным управлением     
    
**CMS:**   
:white_check_mark: обмен данными через веб-сокет    
:white_check_mark: полностью кастомный текстовый редактор (document.execCommand) 
с возможностью добавлять изображения (и изменять их размеры, расположение и выравнивание в тексте), колонки, отступы, блоки/секции и т.д. Все статьи и проекты на сайте созданы с помощью этого редактора. Работа с Range и Selection    
:white_check_mark: система черновиков для создаваемых материалов    
:white_check_mark: управление заявками в CMS (смена статуса заявки)    
    
**Backend:**   
:white_check_mark: модуль авторизации (argon2, jwt, хранение токена в httpOnly signed Cookies), регистрация по приглашению из CMS (для доступа на страницу регистрации нужен верификационный hash из ссылки в письме)    
:white_check_mark: модуль для работы с БД (MongoDB Atlas)    
:white_check_mark: загрузка пользовательских изображений (multer)    
:white_check_mark: веб-сокет (expressWs)    
:white_check_mark: lodash templates в качестве шаблонизатора    
:white_check_mark: отправка заявок с сайта на почту (nodemailer) с отдельным HTML-шаблоном письма    

## Технологии   
:white_check_mark: Vanilla JS     
:white_check_mark: SCSS    
:white_check_mark: YouTube API    
:white_check_mark: NodeJS, express server    
:white_check_mark: argon2, jwt    
:white_check_mark: MongoDB Atlas    
:white_check_mark: multer, expressWs, nodemailer, lodash templates     
:white_check_mark: Webpack     
