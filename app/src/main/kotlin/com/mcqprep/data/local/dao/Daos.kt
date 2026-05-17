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

    @Query("SELECT * FROM concepts WHERE isLeech = 1")
    fun getLeechConcepts(): Flow<List<ConceptEntity>>
}

@Dao
interface QuestionDao {
    @Transaction
    @Query("SELECT * FROM questions WHERE conceptId = :conceptId")
    suspend fun getQuestionsWithDetails(conceptId: String): List<QuestionWithDetails>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestion(question: QuestionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOptions(options: List<OptionEntity>)
}

data class QuestionWithDetails(
    @Embedded val question: QuestionEntity,
    @Relation(
        parentColumns = "id",
        entityColumn = "questionId"
    )
    val options: List<OptionEntity>
)

@Dao
interface ReviewDao {
    @Insert
    suspend fun insertLog(log: ReviewLogEntity)

    @Query("SELECT * FROM review_history WHERE conceptId = :conceptId ORDER BY reviewTime DESC")
    fun getHistory(conceptId: String): Flow<List<ReviewLogEntity>>
}
