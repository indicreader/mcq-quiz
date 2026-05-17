package com.mcqprep.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mcqprep.data.local.dao.QuestionWithDetails
import com.mcqprep.data.local.entity.ConceptEntity
import com.mcqprep.data.local.entity.OptionEntity
import com.mcqprep.scheduler.FSRSScheduler
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SessionState(
    val currentConcept: ConceptEntity? = null,
    val currentQuestion: QuestionWithDetails? = null,
    val shuffledOptions: List<OptionEntity> = emptyList(),
    val isAnswerRevealed: Boolean = false,
    val selectedOptionId: String? = null,
    val isFinished: Boolean = false,
    val progress: Float = 0f,
    val totalInSession: Int = 0,
    val completedInSession: Int = 0
)

class SessionViewModel : ViewModel() {
    private val scheduler = FSRSScheduler()
    private val _uiState = MutableStateFlow(SessionState())
    val uiState = _uiState.asStateFlow()

    // In a real app, inject DAOs here
    
    fun startSession(mode: String) {
        // Load initial data
        // For demo purposes, we'll assume there's a queue of concepts
    }

    fun onOptionSelected(optionId: String) {
        _uiState.value = _uiState.value.copy(
            selectedOptionId = optionId,
            isAnswerRevealed = true
        )
    }

    fun onRatingSelected(rating: Int) {
        val currentConcept = _uiState.value.currentConcept ?: return
        
        // Apply FSRS
        val nextSched = scheduler.step(currentConcept, rating)
        
        // Update database (omitted for brevity, would use ConceptDao)
        
        // Move to next
        loadNext()
    }

    private fun loadNext() {
        // Implementation for loading next question
    }
}
