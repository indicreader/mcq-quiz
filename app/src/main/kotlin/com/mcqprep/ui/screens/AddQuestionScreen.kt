package com.mcqprep.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mcqprep.data.local.dao.ConceptDao
import com.mcqprep.data.local.dao.QuestionDao
import com.mcqprep.data.local.entity.DeckEntity
import com.mcqprep.data.local.entity.SubjectEntity
import com.mcqprep.data.local.entity.TopicEntity
import com.mcqprep.data.local.entity.ConceptEntity
import com.mcqprep.data.local.entity.OptionEntity
import com.mcqprep.data.local.entity.QuestionEntity
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddQuestionScreen(
    navController: NavController,
    conceptDao: ConceptDao,
    questionDao: QuestionDao
) {
    var deckName by remember { mutableStateOf("") }
    var conceptName by remember { mutableStateOf("") }
    var questionText by remember { mutableStateOf("") }
    var optionA by remember { mutableStateOf("") }
    var optionB by remember { mutableStateOf("") }
    var optionC by remember { mutableStateOf("") }
    var optionD by remember { mutableStateOf("") }
    var correctOption by remember { mutableStateOf(0) }
    var explanation by remember { mutableStateOf("") }
    
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add Question") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ChevronLeft, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(scrollState),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = deckName,
                onValueChange = { deckName = it },
                label = { Text("Deck Name (Subject)") },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("e.g. Organic Chemistry") }
            )

            OutlinedTextField(
                value = conceptName,
                onValueChange = { conceptName = it },
                label = { Text("Topic/Concept Name") },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("e.g. Alkenes") }
            )

            OutlinedTextField(
                value = questionText,
                onValueChange = { questionText = it },
                label = { Text("Question") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            Text("Options (Select correct one)", style = MaterialTheme.typography.labelMedium)

            listOf(optionA, optionB, optionC, optionD).forEachIndexed { index, text ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(
                        selected = correctOption == index,
                        onClick = { correctOption = index }
                    )
                    OutlinedTextField(
                        value = when(index) {
                            0 -> optionA
                            1 -> optionB
                            2 -> optionC
                            else -> optionD
                        },
                        onValueChange = { newValue ->
                            when(index) {
                                0 -> optionA = newValue
                                1 -> optionB = newValue
                                2 -> optionC = newValue
                                else -> optionD = newValue
                            }
                        },
                        label = { Text("Option ${'A' + index}") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            OutlinedTextField(
                value = explanation,
                onValueChange = { explanation = it },
                label = { Text("Explanation") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2
            )

            Button(
                onClick = {
                    if (deckName.isBlank() || conceptName.isBlank() || questionText.isBlank()) return@Button
                    
                    scope.launch {
                        // find or create deck
                        val decks = conceptDao.getAllDecksSync() // I need to add this to DAO or use Flow
                        val existingDeck = decks.find { it.name.equals(deckName, true) }
                        val deckId = existingDeck?.id ?: UUID.randomUUID().toString()
                        
                        if (existingDeck == null) {
                            conceptDao.insertDeck(DeckEntity(id = deckId, name = deckName, description = "", version = "1.0"))
                        }

                        // find or create subject (for now 1:1 with deck)
                        val subjectId = deckId // Reuse deck ID as subject ID for simplicity in "anki-like" structure
                        conceptDao.insertSubject(SubjectEntity(id = subjectId, deckId = deckId, name = deckName))

                        // find or create topic
                        val topicId = UUID.randomUUID().toString()
                        conceptDao.insertTopic(TopicEntity(id = topicId, subjectId = subjectId, name = conceptName))

                        // create concept
                        val conceptId = UUID.randomUUID().toString()
                        conceptDao.insertConcept(ConceptEntity(
                            id = conceptId,
                            topicId = topicId,
                            name = conceptName,
                            description = "",
                            stability = 0.0,
                            difficulty = 0.0,
                            elapsedDays = 0,
                            scheduledDays = 0,
                            reps = 0,
                            lapses = 0,
                            state = 0,
                            nextReview = System.currentTimeMillis()
                        ))

                        val questionId = UUID.randomUUID().toString()
                        questionDao.insertQuestion(QuestionEntity(
                            id = questionId,
                            conceptId = conceptId,
                            text = questionText,
                            explanation = explanation,
                            difficulty = "Medium",
                            negativeMarking = 0.25f,
                            tags = ""
                        ))

                        val options = listOf(
                            OptionEntity(UUID.randomUUID().toString(), questionId, optionA, correctOption == 0, 0),
                            OptionEntity(UUID.randomUUID().toString(), questionId, optionB, correctOption == 1, 1),
                            OptionEntity(UUID.randomUUID().toString(), questionId, optionC, correctOption == 2, 2),
                            OptionEntity(UUID.randomUUID().toString(), questionId, optionD, correctOption == 3, 3)
                        )
                        questionDao.insertOptions(options)

                        navController.popBackStack()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(16.dp)
            ) {
                Icon(Icons.Default.Add, null)
                Spacer(Modifier.width(8.dp))
                Text("Save Question")
            }
        }
    }
}
