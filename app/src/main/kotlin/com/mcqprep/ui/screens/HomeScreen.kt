package com.mcqprep.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import com.mcqprep.data.local.dao.ConceptDao
import com.mcqprep.data.local.dao.StudyDao
import com.mcqprep.data.local.entity.DeckEntity
import com.mcqprep.data.local.entity.ExamPatternEntity
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(navController: NavController, conceptDao: ConceptDao, studyDao: StudyDao) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val decks by conceptDao.getAllDecks().collectAsState(initial = emptyList())
    var selectedDeckId by remember { mutableStateOf<String?>(null) }
    val selectedDeckName = decks.find { it.id == selectedDeckId }?.name ?: "Master Deck"

    var selectedMode by remember { mutableStateOf("practice") }
    val patterns by studyDao.getAllExamPatterns().collectAsState(initial = emptyList())

    LaunchedEffect(Unit) {
        scope.launch {
            if (studyDao.getAllExamPatterns().first().isEmpty()) {
                listOf(
                    ExamPatternEntity(
                        name = "SSC CGL (Tier 1)",
                        totalQuestions = 100,
                        totalTimeMinutes = 60,
                        negativeMarking = 0.5f,
                        marksPerCorrect = 2f,
                        sectionalDistribution = "{}"
                    ),
                    ExamPatternEntity(
                        name = "UPSC CSAT",
                        totalQuestions = 80,
                        totalTimeMinutes = 120,
                        negativeMarking = 0.83f,
                        marksPerCorrect = 2.5f,
                        sectionalDistribution = "{}"
                    )
                ).forEach { studyDao.insertExamPattern(it) }
            }
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Spacer(Modifier.height(12.dp))
                NavigationDrawerItem(
                    label = { Text("Master Deck") },
                    selected = selectedDeckId == null,
                    onClick = { 
                        selectedDeckId = null
                        scope.launch { drawerState.close() }
                    },
                    modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                )
                Divider(Modifier.padding(vertical = 8.dp))
                Text(
                    "My Subjects",
                    modifier = Modifier.padding(horizontal = 28.dp, vertical = 16.dp),
                    style = MaterialTheme.typography.titleSmall
                )
                decks.forEach { deck ->
                    NavigationDrawerItem(
                        label = { Text(deck.name) },
                        selected = selectedDeckId == deck.id,
                        onClick = { 
                            selectedDeckId = deck.id
                            scope.launch { drawerState.close() }
                        },
                        modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                    )
                }
                
                Divider(Modifier.padding(vertical = 8.dp))
                Text(
                    "Study Modes",
                    modifier = Modifier.padding(horizontal = 28.dp, vertical = 16.dp),
                    style = MaterialTheme.typography.titleSmall
                )
                
                val modes = listOf(
                    Triple("practice", "Practice Mode", Icons.Default.PlayArrow),
                    Triple("test", "Test Mode", Icons.Default.Timer),
                    Triple("revision", "Revise Mode", Icons.Default.Refresh)
                )
                
                modes.forEach { (mode, label, icon) ->
                    NavigationDrawerItem(
                        label = { Text(label) },
                        icon = { Icon(icon, null) },
                        selected = selectedMode == mode,
                        onClick = { 
                            selectedMode = mode
                            scope.launch { drawerState.close() }
                            // Option to immediately start session or just select
                            // To follow "select easy" request, selecting here is enough 
                            // but starting is also an option if desired. 
                        },
                        modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                    )
                }

                Spacer(Modifier.weight(1f))
                Divider(Modifier.padding(vertical = 8.dp))
                NavigationDrawerItem(
                    label = { Text("Settings") },
                    icon = { Icon(Icons.Default.Settings, null) },
                    selected = false,
                    onClick = { 
                        scope.launch { drawerState.close() }
                        navController.navigate("settings")
                    },
                    modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                )
                Spacer(Modifier.height(12.dp))
            }
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // App Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                IconButton(onClick = { scope.launch { drawerState.open() } }) {
                    Icon(Icons.Default.Menu, null)
                }
                Column {
                    Text(
                        text = selectedDeckName,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (selectedDeckId == null) "All Subjects" else "Single Subject",
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }

        Spacer(modifier = Modifier.height(16.dp))

        // Daily Progress Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(text = "DUE TODAY", style = MaterialTheme.typography.labelMedium)
                Text(
                    text = "42 Concepts",
                    style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.Medium
                )
                
                LinearProgressIndicator(
                    progress = 0.3f,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp)
                )
                
                Text(
                    text = "12 reviewed of 54 total",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }

        // Stats Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatItem(
                label = "STREAK",
                value = "7 Days",
                modifier = Modifier.weight(1f)
            )
            StatItem(
                label = "MASTERY",
                value = "64%",
                modifier = Modifier.weight(1f)
            )
        }

        // Weak Concepts Preview
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(
                text = "WEAK CONCEPTS",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary
            )
            Spacer(modifier = Modifier.height(8.dp))
            repeat(2) { index ->
                Surface(
                    onClick = { /* Navigate to detail */ },
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.small
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (index == 0) "Thermodynamics (Topic)" else "Organic Chemistry (Topic)",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            text = "42%",
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // Mode Selector
        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            val modes = listOf("practice", "test", "revision")
            modes.forEachIndexed { index, mode ->
                SegmentedButton(
                    shape = SegmentedButtonDefaults.itemShape(index = index, count = modes.size),
                    onClick = { selectedMode = mode },
                    selected = selectedMode == mode
                ) {
                    Text(mode.uppercase())
                }
            }
        }

        // Primary CTA
        Button(
            onClick = { 
                val route = if (selectedDeckId != null) "session/$selectedMode?deckId=$selectedDeckId" else "session/$selectedMode"
                navController.navigate(route) 
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            shape = MaterialTheme.shapes.medium
        ) {
            Text(text = "START ${selectedMode.uppercase()}", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        }

        OutlinedButton(
            onClick = { navController.navigate("add") },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = MaterialTheme.shapes.medium
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text(text = "ADD QUESTION")
        }
        
        TextButton(onClick = { navController.navigate("stats") }) {
            Text(text = "VIEW FULL STATISTICS")
        }
    }
    }
}

@Composable
fun StatItem(label: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = label, style = MaterialTheme.typography.labelSmall)
            Text(text = value, style = MaterialTheme.typography.titleLarge)
        }
    }
}
