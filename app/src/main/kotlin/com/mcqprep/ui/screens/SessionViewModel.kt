package com.mcqprep.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mcqprep.data.local.dao.ConceptDao
import com.mcqprep.data.local.dao.QuestionDao
import com.mcqprep.data.local.dao.ReviewDao
import com.mcqprep.data.local.dao.QuestionWithDetails
import com.mcqprep.data.local.entity.ConceptEntity
import com.mcqprep.data.local.entity.OptionEntity
import com.mcqprep.data.local.entity.ReviewLogEntity
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

class SessionViewModel(
    private val conceptDao: ConceptDao,
    private val questionDao: QuestionDao,
    private val reviewDao: ReviewDao
) : ViewModel() {
    private val scheduler = FSRSScheduler()
    private val _uiState = MutableStateFlow(SessionState())
    val uiState = _uiState.asStateFlow()

    private var queue: List<ConceptEntity> = emptyList()

    fun startSession(mode: String, deckId: String? = null) {
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            val flow = if (deckId != null) {
                conceptDao.getDueConceptsByDeck(deckId, now)
            } else {
                conceptDao.getDueConcepts(now)
            }

            flow.collect { concepts ->
                queue = concepts
                _uiState.value = _uiState.value.copy(
                    totalInSession = concepts.size,
                    progress = 0f,
                    completedInSession = 0,
                    isFinished = false
                )
                if (concepts.isNotEmpty()) {
                    loadConcept(concepts.first())
                } else if (mode != "revision") {
                    // fall back to random concepts if revision empty and in practice mode
                    // (simplified for now)
                }
            }
        }
    }

    private fun loadConcept(concept: ConceptEntity) {
        viewModelScope.launch {
            val questions = questionDao.getQuestionsWithDetails(concept.id)
            if (questions.isNotEmpty()) {
                val question = questions.random()
                _uiState.value = _uiState.value.copy(
                    currentConcept = concept,
                    currentQuestion = question,
                    shuffledOptions = question.options.shuffled(),
                    isAnswerRevealed = false,
                    selectedOptionId = null
                )
            }
        }
    }

    fun onOptionSelected(optionId: String) {
        if (_uiState.value.isAnswerRevealed) return
        _uiState.value = _uiState.value.copy(
            selectedOptionId = optionId,
            isAnswerRevealed = true
        )
    }

    fun onRatingSelected(rating: Int) {
        val currentConcept = _uiState.value.currentConcept ?: return
        
        viewModelScope.launch {
            val sched = scheduler.step(currentConcept, rating)
            val now = System.currentTimeMillis()
            
            // Log review
            reviewDao.insertLog(ReviewLogEntity(
                conceptId = currentConcept.id,
                rating = rating,
                responseTime = 0, // Placeholder
                scheduledDays = sched.interval,
                elapsedDays = currentConcept.elapsedDays,
                stability = sched.stability,
                difficulty = sched.difficulty
            ))

            // Update concept
            conceptDao.updateConcept(currentConcept.copy(
                stability = sched.stability,
                difficulty = sched.difficulty,
                scheduledDays = sched.interval,
                elapsedDays = 0, // Reset elapsed
                nextReview = now + (sched.interval * 24 * 60 * 60 * 1000L),
                lastReview = now,
                reps = currentConcept.reps + 1,
                state = sched.state
            ))
            
            // Move next
            val nextIndex = queue.indexOf(currentConcept) + 1
            if (nextIndex < queue.size) {
                _uiState.value = _uiState.value.copy(
                    completedInSession = nextIndex,
                    progress = nextIndex.toFloat() / queue.size
                )
                loadConcept(queue[nextIndex])
            } else {
                _uiState.value = _uiState.value.copy(isFinished = true)
            }
        }
    }
}
