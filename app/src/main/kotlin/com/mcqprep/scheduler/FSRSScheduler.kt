package com.mcqprep.scheduler

import com.mcqprep.data.local.entity.ConceptEntity
import com.mcqprep.data.local.entity.ReviewLogEntity
import java.util.concurrent.TimeUnit
import kotlin.math.*

/**
 * Simplified FSRS-inspired scheduler.
 * Based on the FSRS-rs and Anki-FSRS implementations.
 */
class FSRSScheduler {

    data class SchedulingInfo(
        val stability: Double,
        val difficulty: Double,
        val interval: Int,
        val state: Int
    )

    // Weights (simplified for this app version)
    private val w = doubleArrayOf(
        0.4, 0.6, 2.4, 5.8, // Initial stability for Again, Hard, Good, Easy
        4.9, 0.94, 0.86, 0.01, // Stability decay and growth constants
        0.91, 0.02, 0.11, // Difficulty growth constants
        1.0, 0.0, // Retrievability constants
        0.0 // Reserved
    )

    fun step(concept: ConceptEntity, rating: Int): SchedulingInfo {
        val lastStability = concept.stability
        val lastDifficulty = concept.difficulty
        val state = concept.state

        return if (state == 0) { // New
            init(rating)
        } else {
            nextStep(lastStability, lastDifficulty, concept.elapsedDays, rating)
        }
    }

    private fun init(rating: Int): SchedulingInfo {
        val s = w[rating - 1]
        val d = 5.0 - (rating - 3) * 2.0 // Simple initial difficulty
        return SchedulingInfo(s, d, calculateInterval(s), 2) // Moving to Review state
    }

    private fun nextStep(s: Double, d: Double, elapsed: Int, rating: Int): SchedulingInfo {
        val retrievability = calculateRetrievability(s, elapsed)
        
        // Update Difficulty
        var newD = d - (rating - 3) * 1.5
        newD = newD.coerceIn(1.0, 10.0)

        // Update Stability
        val newS = if (rating == 1) { // Again
            0.5 * s // Simple decay on failure
        } else {
            s * (1 + exp(w[8]) * (11 - newD) * s.pow(-w[9]) * (exp((1 - retrievability) * w[10]) - 1))
        }

        return SchedulingInfo(newS, newD, calculateInterval(newS), 2)
    }

    private fun calculateRetrievability(s: Double, elapsed: Int): Double {
        return (1 + elapsed / (9 * s)).pow(-1)
    }

    private fun calculateInterval(s: Double): Int {
        val interval = s * 9 // Using 90% retention target constant
        return interval.toInt().coerceAtLeast(1)
    }
}
