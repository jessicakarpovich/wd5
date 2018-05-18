# Introduction #

This project is a SPA written in JS for reviewing Japanese Kanji. It uses the public [Kanji Alive API](https://app.kanjialive.com/api/docs) to get kanji by grade level and then load details for each. Check it [out!](https://jessicakarpovich.github.io/wd5/)

## Structure ##

The index.html file only has the header and sidebar content. The rest is loaded through JS depending on user actions. For styling it uses [Sass](http://sass-lang.com/).

The Home page displays high scores from local storage. 

The Overview page lists the available kanji levels. If the user chooses to view them, kanji of the grade level are loaded in and shown one at a time. 

The Review Game allows the user to select how many questions and from what grade level to review. Kanji from that grade level are randomly presented and the user is prompted to give the English translation. Once all questions are answered, the score is calculated and high scores are saved into local storage.

The Kanji Search page is for looking up kanji and finding their grade level and English meaning.

## Current Functionality ##

Responsive styling and all functionality is now complete. Feel free to try it out!