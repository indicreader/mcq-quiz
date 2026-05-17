package com.mcqprep.data.local.entity

import androidx.room.Embedded
import androidx.room.Relation

data class QuestionWithDetails(
    @Embedded val question: QuestionEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "questionId"
    )
    val options: List<OptionEntity>
)
