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
import androidx.compose.ui.platform.LocalView
import android.view.HapticFeedbackConstants
import androidx.compose.ui.platform.LocalContext
import com.mcqprep.data.local.entity.QuestionWithDetails
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Warning

import androidx.compose.foundation.BorderStroke
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close

@Composable
fun SessionScreen(navController: NavController, mode: String, viewModel: SessionViewModel) {
    val state by viewModel.uiState.collectAsState()
    val hapticSignal by viewModel.hapticSignal.collectAsState()
    val view = LocalView.current

    LaunchedEffect(hapticSignal) {
        hapticSignal?.let { signal ->
            when (signal) {
                SessionViewModel.HapticType.SELECT -> view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                SessionViewModel.HapticType.CORRECT -> view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                SessionViewModel.HapticType.WRONG -> view.performHapticFeedback(HapticFeedbackConstants.REJECT)
                SessionViewModel.HapticType.FINISH -> view.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
            }
        }
    }

    if (state.isFinished) {
        SessionResultScreen(
            correct = state.completedInSession, // Simplified for now
            total = state.totalInSession,
            onFinish = { navController.popBackStack() }
        )
        return
    }

    Scaffold(
        topBar = {
            SessionTopBar(
                progress = state.progress, 
                onBack = { navController.popBackStack() },
                mode = mode
            )
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
                content = state.currentQuestion?.question?.text ?: "Question Text",
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp)
            )

            // Options List
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
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
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        shape = MaterialTheme.shapes.medium
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = "EXPLANATION", 
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Markdown(
                                content = state.currentQuestion?.question?.explanation ?: "No explanation provided."
                            )
                        }
                    }

                    Button(
                        onClick = { viewModel.nextQuestion() },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = MaterialTheme.shapes.large
                    ) {
                        Text("NEXT QUESTION")
                    }
                }
            }
        }
    }
}

@Composable
fun SessionResultScreen(correct: Int, total: Int, onFinish: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Text(
                "Session Finished",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold
            )
            
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                ResultChip("CORRECT", correct.toString(), Color.Green)
                ResultChip("ACCURACY", "${(correct.toFloat()/total * 100).toInt()}%", Color.Blue)
            }

            Button(onClick = onFinish, modifier = Modifier.padding(top = 32.dp)) {
                Text("BACK TO HOME")
            }
        }
    }
}

@Composable
fun ResultChip(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, style = MaterialTheme.typography.labelSmall)
        Text(text = value, style = MaterialTheme.typography.headlineMedium, color = color, fontWeight = FontWeight.Bold)
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
fun SessionTopBar(progress: Float, onBack: () -> Unit, mode: String) {
    TopAppBar(
        title = {
            Column(Modifier.fillMaxWidth()) {
                LinearProgressIndicator(
                    progress = progress,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(end = 16.dp)
                )
                Text(
                    text = mode.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary,
                    fontWeight = FontWeight.Bold
                )
            }
        },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ChevronLeft, "Back")
            }
        },
        actions = {
            Icon(Icons.Default.Timer, null, tint = MaterialTheme.colorScheme.secondary)
            Spacer(Modifier.width(4.dp))
            Text("24:59", style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.width(16.dp))
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
                border = BorderStroke(1.dp, rating.color)
            ) {
                Text(text = rating.label, color = rating.color, style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

data class RatingInfo(val value: Int, val label: String, val color: Color)
