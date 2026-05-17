package com.mcqprep.data.local.entity

import androidx.room.*
import java.util.*

@Entity(tableName = "decks")
data class DeckEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val description: String,
    val version: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "subjects",
    foreignKeys = [
        ForeignKey(
            entity = DeckEntity::class,
            parentColumns = ["id"],
            childColumns = ["deckId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class SubjectEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val deckId: String,
    val name: String
)

@Entity(
    tableName = "topics",
    foreignKeys = [
        ForeignKey(
            entity = SubjectEntity::class,
            parentColumns = ["id"],
            childColumns = ["subjectId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class TopicEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val subjectId: String,
    val name: String
)

@Entity(
    tableName = "concepts",
    foreignKeys = [
        ForeignKey(
            entity = TopicEntity::class,
            parentColumns = ["id"],
            childColumns = ["topicId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class ConceptEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    @ColumnInfo(index = true) val topicId: String,
    val name: String,
    val description: String,
    // FSRS Metadata
    val stability: Double = 0.0,
    val difficulty: Double = 0.0,
    val elapsedDays: Int = 0,
    val scheduledDays: Int = 0,
    val reps: Int = 0,
    val lapses: Int = 0,
    val state: Int = 0, // 0: New, 1: Learning, 2: Review, 3: Relearning
    val lastReview: Long? = null,
    val nextReview: Long? = null,
    val isLeech: Boolean = false
)

@Entity(
    tableName = "questions",
    foreignKeys = [
        ForeignKey(
            entity = ConceptEntity::class,
            parentColumns = ["id"],
            childColumns = ["conceptId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class QuestionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    @ColumnInfo(index = true) val conceptId: String,
    val text: String,
    val type: String = "MCQ",
    val explanation: String,
    val difficulty: String, // Easy, Medium, Hard
    val source: String? = null,
    val negativeMarking: Float = 0.25f,
    val tags: String, // Comma separated tags
    
    // Rotation & Analytics
    val lastSeenTimestamp: Long = 0,
    val solveCount: Int = 0,
    val correctCount: Int = 0,
    val wrongCount: Int = 0,
    val masteryScore: Float = 0f, // 0.0 to 1.0
    val isRecentlyUsed: Boolean = false
)

@Entity(
    tableName = "options",
    foreignKeys = [
        ForeignKey(
            entity = QuestionEntity::class,
            parentColumns = ["id"],
            childColumns = ["questionId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class OptionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    @ColumnInfo(index = true) val questionId: String,
    val text: String,
    val isCorrect: Boolean,
    val order: Int // To maintain index if needed, but UI will shuffle
)

@Entity(tableName = "review_history",
    foreignKeys = [
        ForeignKey(
            entity = ConceptEntity::class,
            parentColumns = ["id"],
            childColumns = ["conceptId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class ReviewLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val conceptId: String,
    val rating: Int, // 1: Again, 2: Hard, 3: Good, 4: Easy
    val responseTime: Long,
    val scheduledDays: Int,
    val elapsedDays: Int,
    val stability: Double,
    val difficulty: Double,
    val reviewTime: Long = System.currentTimeMillis()
)

@Entity(tableName = "session_state")
data class SessionStateEntity(
    @PrimaryKey val mode: String, // practice, test, revision
    val startTime: Long,
    val timeLimit: Long,
    val currentQuestionIndex: Int,
    val questionIds: String, // Comma separated IDs
    val selectedAnswers: String, // JSON or Comma separated ID map
    val isPaused: Boolean = false,
    val elapsedSeconds: Long = 0
)

@Entity(tableName = "exam_patterns")
data class ExamPatternEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val totalQuestions: Int,
    val totalTimeMinutes: Int,
    val negativeMarking: Float,
    val marksPerCorrect: Float,
    val sectionalDistribution: String // JSON: { "english": 25, "maths": 25, ... }
)

@Entity(tableName = "session_analytics")
data class SessionAnalyticsEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val mode: String,
    val timestamp: Long = System.currentTimeMillis(),
    val totalQuestions: Int,
    val correctCount: Int,
    val wrongCount: Int,
    val skippedCount: Int,
    val accuracy: Float,
    val averageSpeedSeconds: Float,
    val weakTopics: String // Comma separated topic names
)
