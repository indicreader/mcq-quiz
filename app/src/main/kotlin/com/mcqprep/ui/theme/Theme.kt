package com.mcqprep.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFD1E6FF),
    secondary = Color(0xFFC0C7D5),
    tertiary = Color(0xFFDDBCE0),
    background = Color(0xFF1B1B1F),
    surface = Color(0xFF1B1B1F)
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF0061A4),
    secondary = Color(0xFF535F70),
    tertiary = Color(0xFF715573),
    background = Color(0xFFFEFBFF),
    surface = Color(0xFFFEFBFF)
)

@Composable
fun McqPrepTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
