package com.mcqprep.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import dev.jeziellago.compose.markdown.Markdown

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close

@Composable
fun SessionScreen(navController: NavController, mode: String, viewModel: SessionViewModel) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(mode) {
        viewModel.startSession(mode)
    }

    if (state.isFinished) {
        navController.popBackStack()
    }

    Scaffold(
        topBar = {
            SessionTopBar(progress = state.progress, onBack = { navController.popBackStack() })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Question Text
            Markdown(
                content = state.currentQuestion?.question?.text ?: "What is the primary law of thermodynamics concerning energy conservation?",
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp)
            )

            // Options List
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                state.shuffledOptions.forEach { option ->
                    OptionCard(
                        text = option.text,
                        isSelected = state.selectedOptionId == option.id,
                        isRevealed = state.isAnswerRevealed,
                        isCorrect = option.isCorrect,
                        onClick = { viewModel.onOptionSelected(option.id) }
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Footer: Explanation or Action Buttons
            AnimatedVisibility(
                visible = state.isAnswerRevealed,
                enter = slideInVertically { it } + fadeIn()
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Explanation
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = MaterialTheme.shapes.medium
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(text = "EXPLANATION", style = MaterialTheme.typography.labelSmall)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "The First Law of Thermodynamics states that energy cannot be created or destroyed in an isolated system.",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }

                    // Rating Buttons
                    RatingBar(onRatingSelected = { viewModel.onRatingSelected(it) })
                }
            }
        }
    }
}

@Composable
fun OptionCard(text: String, isSelected: Boolean, isRevealed: Boolean, isCorrect: Boolean, onClick: () -> Unit) {
    val borderColor = when {
        isRevealed && isCorrect -> Color.Green
        isRevealed && isSelected && !isCorrect -> Color.Red
        isSelected -> MaterialTheme.colorScheme.primary
        else -> MaterialTheme.colorScheme.outline
    }

    Surface(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, borderColor, MaterialTheme.shapes.small),
        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.small
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = text, style = MaterialTheme.typography.bodyLarge)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SessionTopBar(progress: Float, onBack: () -> Unit) {
    TopAppBar(
        title = {
            LinearProgressIndicator(
                progress = progress,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(end = 16.dp)
            )
        },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ChevronLeft, "Back")
            }
        }
    )
}

@Composable
fun RatingBar(onRatingSelected: (Int) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        val ratings = listOf(
            RatingInfo(1, "Again", Color.Red),
            RatingInfo(2, "Hard", Color.Orange),
            RatingInfo(3, "Good", Color.Blue),
            RatingInfo(4, "Easy", Color.Green)
        )

        ratings.forEach { rating ->
            Button(
                onClick = { onRatingSelected(rating.value) },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = rating.color.copy(alpha = 0.1f)),
                border = border(1.dp, rating.color, MaterialTheme.shapes.small)
            ) {
                Text(text = rating.label, color = rating.color, style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

fun border(width: androidx.compose.ui.unit.Dp, color: Color, shape: androidx.compose.ui.graphics.Shape) = 
    Modifier.border(width, color, shape)

data class RatingInfo(val value: Int, val label: String, val color: Color)
