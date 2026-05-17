package com.mcqprep.data.local.dao

import androidx.room.*
import com.mcqprep.data.local.entity.*
import kotlinx.coroutines.flow.Flow

@Dao
interface DeckDao {
    @Query("SELECT * FROM decks")
    fun getAllDecks(): Flow<List<DeckEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeck(deck: DeckEntity)

    @Query("SELECT * FROM subjects WHERE deckId = :deckId")
    fun getSubjects(deckId: String): Flow<List<SubjectEntity>>
}

@Dao
interface ConceptDao {
    @Query("SELECT * FROM concepts WHERE nextReview <= :now OR nextReview IS NULL")
    fun getDueConcepts(now: Long): Flow<List<ConceptEntity>>

    @Query("SELECT * FROM concepts WHERE topicId = :topicId")
    fun getConceptsByTopic(topicId: String): Flow<List<ConceptEntity>>

    @Update
    suspend fun updateConcept(concept: ConceptEntity)

    @Query("SELECT COUNT(*) FROM concepts WHERE nextReview <= :now")
    fun getDueCount(now: Long): Flow<Int>

    @Query("""
        SELECT c.* FROM concepts c
        INNER JOIN topics t ON c.topicId = t.id
        INNER JOIN subjects s ON t.subjectId = s.id
        WHERE s.deckId = :deckId AND c.nextReview <= :now
    """)
    fun getDueConceptsByDeck(deckId: String, now: Long): Flow<List<ConceptEntity>>

    @Query("""
        SELECT * FROM decks
    """)
    fun getAllDecks(): Flow<List<DeckEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConcept(concept: ConceptEntity)

    @Query("SELECT * FROM concepts")
    suspend fun getAllConceptsSync(): List<ConceptEntity>

    @Query("SELECT * FROM decks")
    suspend fun getAllDecksSync(): List<DeckEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeck(deck: DeckEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSubject(subject: SubjectEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTopic(topic: TopicEntity)
}

@Dao
interface QuestionDao {
    @Transaction
    @Query("SELECT * FROM questions WHERE conceptId = :conceptId")
    suspend fun getQuestionsWithDetails(conceptId: String): List<QuestionWithDetails>

    @Query("SELECT * FROM questions")
    suspend fun getAllQuestions(): List<QuestionEntity>

    @Query("SELECT * FROM questions WHERE id = :id")
    suspend fun getQuestionById(id: String): QuestionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestion(question: QuestionEntity)

    @Update
    suspend fun updateQuestion(question: QuestionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOptions(options: List<OptionEntity>)
}

@Dao
interface StudyDao {
    @Query("SELECT * FROM session_state WHERE mode = :mode")
    suspend fun getSessionState(mode: String): SessionStateEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSessionState(state: SessionStateEntity)

    @Query("DELETE FROM session_state WHERE mode = :mode")
    suspend fun clearSessionState(mode: String)

    @Query("SELECT * FROM exam_patterns")
    fun getAllExamPatterns(): Flow<List<ExamPatternEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExamPattern(pattern: ExamPatternEntity)

    @Insert
    suspend fun insertAnalytics(analytics: SessionAnalyticsEntity)

    @Query("SELECT * FROM session_analytics ORDER BY timestamp DESC")
    fun getAllAnalytics(): Flow<List<SessionAnalyticsEntity>>

    @Query("SELECT * FROM questions")
    suspend fun getAllQuestionsSync(): List<QuestionEntity>

    @Query("SELECT * FROM questions WHERE id IN (:ids)")
    suspend fun getQuestionsByIds(ids: List<String>): List<QuestionEntity>

    @Query("SELECT * FROM options WHERE questionId IN (:questionIds)")
    suspend fun getOptionsForQuestions(questionIds: List<String>): List<OptionEntity>

    @Query("UPDATE questions SET isRecentlyUsed = 0")
    suspend fun resetRotationFlags()

    @Query("SELECT * FROM questions WHERE wrongCount > 0 OR masteryScore < 0.6")
    fun getWeakQuestions(): Flow<List<QuestionEntity>>
}



@Dao
interface ReviewDao {
    @Insert
    suspend fun insertLog(log: ReviewLogEntity)

    @Query("SELECT * FROM review_history WHERE conceptId = :conceptId ORDER BY reviewTime DESC")
    fun getHistory(conceptId: String): Flow<List<ReviewLogEntity>>
}
