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
import lucide_react.Lucide

@Composable
fun HomeScreen(navController: NavController) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // App Header
        Text(
            text = "mcq-prep",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.align(Alignment.Start)
        )

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

        // Primary CTA
        Button(
            onClick = { navController.navigate("session/revision") },
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            shape = MaterialTheme.shapes.medium
        ) {
            Text(text = "START SESSION", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        }
        
        TextButton(onClick = { navController.navigate("stats") }) {
            Text(text = "VIEW FULL STATISTICS")
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
