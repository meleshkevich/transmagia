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
