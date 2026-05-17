package com.mcqprep.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mcqprep.data.local.dao.ConceptDao
import com.mcqprep.data.local.dao.QuestionDao
import com.mcqprep.data.local.dao.ReviewDao
import com.mcqprep.data.local.dao.StudyDao
import com.mcqprep.data.local.entity.SessionAnalyticsEntity
import com.mcqprep.data.local.entity.SessionStateEntity
import com.mcqprep.data.local.entity.QuestionEntity
import com.mcqprep.data.local.entity.QuestionWithDetails
import com.mcqprep.data.local.entity.ExamPatternEntity
import com.mcqprep.data.local.entity.ConceptEntity
import com.mcqprep.data.local.entity.OptionEntity
import com.mcqprep.data.local.entity.ReviewLogEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

// Add a placeholder for FSRSScheduler
class FSRSScheduler

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
    private val reviewDao: ReviewDao,
    private val studyDao: StudyDao
) : ViewModel() {
    private val scheduler = FSRSScheduler()
    private val _uiState = MutableStateFlow(SessionState())
    val uiState = _uiState.asStateFlow()

    private var questionQueue: List<QuestionWithDetails> = emptyList()
    private var mode: String = "practice"
    private var startTime: Long = 0
    private var examPattern: ExamPatternEntity? = null
    
    // Haptic feedback signal
    private val _hapticSignal = MutableStateFlow<HapticType?>(null)
    val hapticSignal = _hapticSignal.asStateFlow()

    enum class HapticType { SELECT, CORRECT, WRONG, FINISH }

    fun startSession(mode: String, deckId: String? = null, patternId: String? = null, questionCount: Int = 30) {
        this.mode = mode
        this.startTime = System.currentTimeMillis()
        
        viewModelScope.launch {
            // Check for persisted state first
            val savedState = studyDao.getSessionState(mode)
            if (savedState != null && !savedState.isFinished()) {
                 // Restore logic here
            }

            val questions = when (mode) {
                "practice" -> selectPracticeQuestions(deckId, questionCount)
                "test" -> selectTestQuestions(deckId, patternId)
                "revision" -> selectRevisionQuestions(deckId)
                else -> emptyList()
            }

            if (questions.isEmpty()) {
                // Handle empty state
                return@launch
            }

            questionQueue = questions
            _uiState.value = _uiState.value.copy(
                totalInSession = questions.size,
                progress = 0f,
                completedInSession = 0,
                isFinished = false,
                currentQuestion = questions.first(),
                shuffledOptions = questions.first().options.shuffled()
            )
            
            // Mark as recently used
            markQuestionsUsed(questions)
        }
    }

    private suspend fun selectPracticeQuestions(deckId: String?, count: Int): List<QuestionWithDetails> {
        val allQuestions = studyDao.getAllQuestionsSync()
        // Filter by deck if needed... for now simple global rotation
        val filtered = allQuestions.filter { !it.isRecentlyUsed }
        
        val pool = if (filtered.size < count) {
            studyDao.resetRotationFlags()
            allQuestions
        } else {
            filtered
        }
        
        val selected = pool.shuffled().take(count)
        return fetchDetails(selected)
    }

    private suspend fun selectTestQuestions(deckId: String?, patternId: String?): List<QuestionWithDetails> {
        val patterns = studyDao.getAllExamPatterns().first() // This is bit tricky with Flow in repo, assuming sync helper
        val pattern = patternId?.let { id -> patterns.find { it.id == id } } ?: patterns.firstOrNull() ?: return emptyList()
        
        // Sectional distribution logic
        // For simplicity in this demo, we just take total count and shuffle
        // and ensure we don't repeat questions until exhausted
        val allQuestions = studyDao.getAllQuestionsSync()
        val unused = allQuestions.filter { !it.isRecentlyUsed }
        
        val pool = if (unused.size < pattern.totalQuestions) {
            studyDao.resetRotationFlags()
            allQuestions
        } else {
            unused
        }
        
        return fetchDetails(pool.shuffled().take(pattern.totalQuestions))
    }

    private suspend fun selectRevisionQuestions(deckId: String?): List<QuestionWithDetails> {
        // Mode Goal: Error correction + mastery reinforcement.
        // Priority: Repeatedly failed questions, low confidence.
        val weakQuestions = studyDao.getAllQuestionsSync()
            .filter { it.wrongCount > 0 || it.masteryScore < 0.6f }
            .sortedBy { it.masteryScore } // Lowest mastery first
        
        return fetchDetails(weakQuestions.take(30))
    }

    private suspend fun fetchDetails(questions: List<QuestionEntity>): List<QuestionWithDetails> {
        val ids = questions.map { it.id }
        val options = studyDao.getOptionsForQuestions(ids)
        return questions.map { q ->
            QuestionWithDetails(q, options.filter { it.questionId == q.id })
        }
    }

    private suspend fun markQuestionsUsed(questions: List<QuestionWithDetails>) {
        questions.forEach {
            questionDao.updateQuestion(it.question.copy(isRecentlyUsed = true))
        }
    }

    fun onOptionSelected(optionId: String) {
        if (_uiState.value.isAnswerRevealed) return
        
        val currentQuestion = _uiState.value.currentQuestion ?: return
        val selectedOption = _uiState.value.shuffledOptions.find { it.id == optionId }
        val isCorrect = selectedOption?.isCorrect ?: false
        
        _uiState.value = _uiState.value.copy(
            selectedOptionId = optionId,
            isAnswerRevealed = true
        )

        _hapticSignal.value = if (isCorrect) HapticType.CORRECT else HapticType.WRONG
        
        updateQuestionStats(currentQuestion.question, isCorrect)
    }

    private fun updateQuestionStats(question: QuestionEntity, isCorrect: Boolean) {
        viewModelScope.launch {
            val updated = question.copy(
                solveCount = question.solveCount + 1,
                correctCount = if (isCorrect) question.correctCount + 1 else question.correctCount,
                wrongCount = if (!isCorrect) question.wrongCount + 1 else question.wrongCount,
                lastSeenTimestamp = System.currentTimeMillis(),
                masteryScore = calculateMastery(question, isCorrect)
            )
            questionDao.updateQuestion(updated)
        }
    }

    private fun calculateMastery(q: QuestionEntity, latestCorrect: Boolean): Float {
        // Simplified mastery logic
        val total = q.solveCount + 1
        val correct = if (latestCorrect) q.correctCount + 1 else q.correctCount
        return correct.toFloat() / total
    }

    fun nextQuestion() {
        val nextIndex = _uiState.value.completedInSession + 1
        if (nextIndex < questionQueue.size) {
            val nextQ = questionQueue[nextIndex]
            _uiState.value = _uiState.value.copy(
                currentQuestion = nextQ,
                shuffledOptions = nextQ.options.shuffled(),
                isAnswerRevealed = false,
                selectedOptionId = null,
                completedInSession = nextIndex,
                progress = nextIndex.toFloat() / questionQueue.size
            )
            _hapticSignal.value = HapticType.SELECT
        } else {
            finishSession()
        }
    }

    private fun finishSession() {
        _uiState.value = _uiState.value.copy(isFinished = true)
        _hapticSignal.value = HapticType.FINISH
        // Save analytics
    }
    
    // Add extension to check if finished
    private fun SessionStateEntity.isFinished() = false // Logic for recovery
}
