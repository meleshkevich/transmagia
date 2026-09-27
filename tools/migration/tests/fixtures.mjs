/**
 * HTML fixtures for migration parser tests.
 * All fixtures are self-contained strings; no live network access needed.
 */

export const BOOK_PAGE_WITH_CHAPTER_LINKS = `<!DOCTYPE html>
<html>
<head><title>Шум дождя — Трансмагия</title></head>
<body class="page-template">
  <header class="site-header"><nav><a href="/">Главная</a></nav></header>
  <article>
    <h1 class="entry-title">Шум дождя</h1>
    <div class="post-content">
      <p>Список глав:</p>
      <ul>
        <li><a href="https://transmagia.house/1-zhizn/">1. Жизнь — худшая из проявлений реальности</a></li>
        <li><a href="https://transmagia.house/2-son/">2. Сон</a></li>
        <li><a href="https://transmagia.house/3-utro/">3. Утро</a></li>
      </ul>
    </div>
  </article>
  <footer class="site-footer"><a href="/contacts">Контакты</a></footer>
</body>
</html>`;

export const BOOK_PAGE_WITH_UNRELATED_LINKS = `<!DOCTYPE html>
<html>
<head><title>Шум дождя</title></head>
<body>
  <article>
    <div class="post-content">
      <p>Автор: <a href="https://transmagia.house/author/test/">Тестовый автор</a></p>
      <p>Категория: <a href="https://transmagia.house/category/originals/">Оригинальное</a></p>
      <ul>
        <li><a href="https://transmagia.house/chapter-1/">Глава 1</a></li>
        <li><a href="https://transmagia.house/chapter-2/">Глава 2</a></li>
      </ul>
      <p>Внешний: <a href="https://example.com/external">Сторонняя ссылка</a></p>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_NO_CONTENT = `<!DOCTYPE html>
<html>
<head><title>Страница не найдена</title></head>
<body>
  <h1>404 — Страница не найдена</h1>
</body>
</html>`;

export const CHAPTER_PAGE_NORMAL = `<!DOCTYPE html>
<html>
<head><title>1. Жизнь — худшая из проявлений реальности — Трансмагия</title></head>
<body class="postid-12345 single-post">
  <header class="site-header"><nav><a href="/">Главная</a></nav></header>
  <article>
    <h1 class="post-title">1. Жизнь — худшая из проявлений реальности</h1>
    <div class="post-content">
      <p>Дождь шёл уже третий день подряд.</p>
      <p>Анна смотрела в окно и думала о том, что жизнь — это, пожалуй, худшее из всех возможных проявлений реальности.</p>
      <p>Хотя, с другой стороны, альтернативы у неё не было.</p>
    </div>
    <div class="post-navigation">
      <a class="previous" href="/prologue/">Предыдущая</a>
      <a class="next" href="/2-son/">Следующая</a>
    </div>
    <div class="comments-area">
      <form class="comment-respond"></form>
    </div>
  </article>
  <footer class="site-footer"></footer>
</body>
</html>`;

export const CHAPTER_PAGE_WITH_IMAGES = `<!DOCTYPE html>
<html>
<head><title>Глава с картинкой</title></head>
<body class="postid-99999 single-post">
  <article>
    <h1 class="post-title">Глава с иллюстрацией</h1>
    <div class="post-content">
      <p>Текст перед картинкой.</p>
      <img src="https://transmagia.house/wp-content/uploads/illustration.jpg" alt="Иллюстрация">
      <p>Текст после картинки.</p>
    </div>
  </article>
</body>
</html>`;

export const CHAPTER_PAGE_NO_CONTENT_CONTAINER = `<!DOCTYPE html>
<html>
<head><title>Обычная страница без статьи</title></head>
<body>
  <div class="page-wrapper">
    <p>Содержимое страницы без стандартного WordPress контейнера.</p>
  </div>
</body>
</html>`;

export const CHAPTER_PAGE_MALFORMED_HTML = `<html>
<head><title>Кривая HTML страница</head>
<body>
  <article>
    <div class="post-content">
      <p>Незакрытый абзац
      <p>Второй абзац с <b>жирным текстом без закрытия
    </div>
  </article>
`;

// ── Book page fixtures ───────────────────────────────────────────────────────

export const BOOK_PAGE_PESKI_STYLE = `<!DOCTYPE html>
<html>
<head><title>Пески времени или Обратный отсчёт — Трансмагия</title></head>
<body class="page-id-456 page-template">
  <header class="site-header"><nav><a href="/">Главная</a></nav></header>
  <article>
    <h1 class="entry-title">Пески времени или Обратный отсчёт</h1>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/07/cover.jpg" alt="Обложка">
      <p></p>
      <p>Питер и Джейн — обычные студенты.</p>
      <p><strong>От Автора:</strong><br>Уважаемые читатели!</p>
      <p>Возрастные рамки : строго 18+</p>
      <a href="https://transmagia.house/prologg/">Пролог</a>
      <a href="https://transmagia.house/glava-1/">Глава 1</a>
      <a href="https://transmagia.house/glava-2/">Глава 2</a>
    </div>
  </article>
  <footer class="site-footer"></footer>
</body>
</html>`;

export const BOOK_PAGE_COVER_IN_P_WRAPPER = `<!DOCTYPE html>
<html>
<head><title>Книга с обложкой в параграфе</title></head>
<body class="page-id-100 page-template">
  <article>
    <div class="post-content">
      <p><img src="https://transmagia.house/wp-content/uploads/2026/06/cover2.jpg" alt="Обложка"></p>
      <p>Описание книги здесь.</p>
      <p>Второй абзац описания.</p>
      <a href="https://transmagia.house/glava-1/">Глава 1</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_WITH_LIST_CHAPTERS = `<!DOCTYPE html>
<html>
<head><title>Книга со списком глав</title></head>
<body class="page-id-200 page-template">
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/cover3.jpg" alt="Обложка">
      <p>Описание книги.</p>
      <p><em>Предупреждение</em> — 18+</p>
      <p>Список глав:</p>
      <ul>
        <li><a href="https://transmagia.house/ch-1/">Глава 1</a></li>
        <li><a href="https://transmagia.house/ch-2/">Глава 2</a></li>
        <li><a href="https://transmagia.house/ch-3/">Глава 3</a></li>
      </ul>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_NO_COVER = `<!DOCTYPE html>
<html>
<head><title>Книга без обложки</title></head>
<body class="page-id-300 page-template">
  <article>
    <div class="post-content">
      <p>Только текст описания, без изображения.</p>
      <p><strong>Автор</strong>: Некто</p>
      <a href="https://transmagia.house/ch-1/">Глава 1</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_NO_DESCRIPTION = `<!DOCTYPE html>
<html>
<head><title>Книга без описания</title></head>
<body class="page-id-400 page-template">
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/cover4.jpg" alt="Обложка">
      <a href="https://transmagia.house/ch-1/">Глава 1</a>
      <a href="https://transmagia.house/ch-2/">Глава 2</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_WITH_BR_IN_DESCRIPTION = `<!DOCTYPE html>
<html>
<head><title>Книга с переносом строки</title></head>
<body class="page-id-500 page-template">
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/cover5.jpg" alt="Обложка">
      <p>Первая строка.<br>Вторая строка в том же абзаце.</p>
      <a href="https://transmagia.house/ch-1/">Глава 1</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_RICH_FORMATTING = `<!DOCTYPE html>
<html>
<head><title>Книга с форматированием</title></head>
<body class="page-id-600 page-template">
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/cover6.jpg" alt="Обложка">
      <p>Обычный текст с <strong>жирным</strong> и <em>курсивом</em>.</p>
      <p><strong>От Автора:</strong></p>
      <p>Текст от автора.</p>
      <p>Возрастное ограничение: 18+</p>
      <a href="https://transmagia.house/glava-1/">Глава 1</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_UNRELATED_IMAGES = `<!DOCTYPE html>
<html>
<head><title>Книга с лишними картинками</title></head>
<body class="page-id-700 page-template">
  <header>
    <img src="https://transmagia.house/wp-content/themes/mytheme/logo.png" alt="Логотип">
  </header>
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/actual-cover.jpg" alt="Обложка">
      <p>Описание.</p>
      <a href="https://transmagia.house/ch-1/">Глава 1</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_EMPTY_PARAGRAPHS = `<!DOCTYPE html>
<html>
<head><title>Книга с пустыми абзацами</title></head>
<body class="page-id-800 page-template">
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/cover8.jpg" alt="Обложка">
      <p></p>
      <p>Основное описание.</p>
      <p></p>
      <a href="https://transmagia.house/ch-1/">Глава 1</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_WITH_MULTI_PARAGRAPH_DESCRIPTION = `<!DOCTYPE html>
<html>
<head><title>Книга с многоабзацным описанием</title></head>
<body class="page-id-900 page-template">
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/cover9.jpg" alt="Обложка">
      <p>Первый абзац описания.</p>
      <p>Второй абзац описания.</p>
      <p>Третий абзац описания.</p>
      <a href="https://transmagia.house/ch-1/">Глава 1</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_CHAPTER_LINKS_WITH_EXTERNAL = `<!DOCTYPE html>
<html>
<head><title>Книга с внешними ссылками в описании</title></head>
<body class="page-id-1000 page-template">
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/cover10.jpg" alt="Обложка">
      <p>Описание с <a href="https://example.com/author">автором</a> на внешнем сайте.</p>
      <a href="https://transmagia.house/ch-1/">Глава 1</a>
      <a href="https://transmagia.house/ch-2/">Глава 2</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_CHAPTER_LINKS_NO_CONTENT = `<!DOCTYPE html>
<html>
<head><title>Страница без контейнера</title></head>
<body>
  <div class="page-wrapper">
    <p>Нет стандартного WordPress контейнера.</p>
  </div>
</body>
</html>`;

export const BOOK_PAGE_AUTHOR_NOTE_AGE_WARNING = `<!DOCTYPE html>
<html>
<head><title>Книга с примечанием автора и предупреждением</title></head>
<body class="page-id-1100 page-template">
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/cover11.jpg" alt="Обложка">
      <p>Основное описание книги.</p>
      <p><strong>От Автора:</strong><br>Уважаемые читатели, добро пожаловать!</p>
      <p>Этот текст для взрослых. Возрастные рамки: строго 18+</p>
      <a href="https://transmagia.house/glava-1/">Глава 1</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_WP_CRUFT = `<!DOCTYPE html>
<html>
<head><title>Книга с WordPress мусором</title></head>
<body class="page-id-1200 page-template">
  <article>
    <div class="post-content">
      <img src="https://transmagia.house/wp-content/uploads/2026/06/cover12.jpg" alt="Обложка">
      <p id="desc" style="color:red" class="wp-block-paragraph">Описание.</p>
      <div class="sharedaddy">Кнопки шаринга</div>
      <a href="https://transmagia.house/ch-1/">Глава 1</a>
    </div>
  </article>
</body>
</html>`;

export const BOOK_PAGE_CHAPTER_LINKS_NO_CONTAINER = `<!DOCTYPE html>
<html>
<head><title>Страница без article</title></head>
<body>
  <div>
    <p>Нет .post-content или .entry-content.</p>
    <a href="https://transmagia.house/ch-1/">Глава 1</a>
  </div>
</body>
</html>`;

export const CHAPTER_PAGE_WP_CRUFT = `<!DOCTYPE html>
<html>
<head><title>Глава</title></head>
<body class="postid-777 single-post">
  <article>
    <h1 class="post-title">Глава с мусором</h1>
    <div class="post-content">
      <p id="keep-text" style="color:red" class="wp-block-paragraph" data-block="abc">Основной текст.</p>
      <div class="sharedaddy">Кнопки шаринга</div>
      <div class="jp-relatedposts">Похожие посты</div>
      <nav>Навигация</nav>
      <script>alert('xss')</script>
      <style>.test { color: red }</style>
    </div>
  </article>
</body>
</html>`;
