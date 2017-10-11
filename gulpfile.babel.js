import gulp from "gulp"
import gulpBabel from "gulp-babel"
import gulpClean from "gulp-clean"

gulp.task("clean", () => {
    return gulp.src(["./src/**/*.js"], {read: false})
        .pipe(gulpClean())
})

gulp.task("babel", () => {
    return gulp.src(["./src/**/*.jsx"], {base: "./"})
        .pipe(gulpBabel())
        .pipe(gulp.dest("."))
})
