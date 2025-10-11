

## Spiker:Bit extension 

![MakeCode](https://img.shields.io/badge/for%20PXT-micro:bit-blue) • EMG • EEG • ECG

This extension enables the use of the Backyard Brains Spiker:Bit with the Microsoft MakeCode editor.
The Spiker:Bit records electrical activity from the brain (EEG), muscles (EMG), and heart (ECG), making neuroscience and physiology experiments accessible in educational settings. Use this extension to create interactive projects and explore real‑time bio‑signals in your classroom or lab.
For more details about the Spiker:Bit please check our product page [Backyard Brains Spiker:Bit](https://backyardbrains.com/products/spiker-bit).

Further learning and lesson ideas:
- [Backyard Brains Education and Experiments](https://backyardbrains.com/experiments)
- [micro:bit MakeCode Tutorials](https://makecode.microbit.org/projects)
- [MakeCode Docs on Extensions](https://makecode.com/extensions)

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/BackyardBrains/pxt-spikerbit** and import

## ~ hint

**Note for micro:bit V1 users:**
On micro:bit V1 boards, you may notice a slight glow on some LEDs. This is due to shared use of certain pins (e.g., pin P9) between the LED matrix and the Spiker:Bit. This visual effect is harmless and does not affect the functionality of the Spiker:Bit or the micro:bit.

## ~

## Edit this project

To edit this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/BackyardBrains/pxt-spikerbit** and click import

## Example

Here is the API with teacher‑friendly examples. You can copy these into MakeCode JavaScript editor.

Classroom example: show EMG envelope on the LEDs for 3 seconds, then stop.
```blocks
spikerbit.startMuscleRecording()
loops.everyInterval(100, function () {
    let value = spikerbit.musclePowerSignal()
    let bar = Math.map(value, 0, 1023, 0, 25)
    led.plotBarGraph(bar, 25)
})
basic.pause(3000)
spikerbit.stopRecord()
```
---

## API Functions

### Muscle Group

#### `startMuscleRecording()`
Starts recording muscle (EMG) signals.

```sig
spikerbit.startMuscleRecording();
```

#### `musclePowerSignal(): number`
Returns the last envelope value of the EMG signal.

```sig
let power = spikerbit.musclePowerSignal();
```

// Raw EMG function is not exposed; use the envelope with `musclePowerSignal()`.

### Heart Group

#### `startHeartRecording()`
Starts recording heart (ECG) signals.

```sig
spikerbit.startHeartRecording();
```

#### `heartSignal(): number`
Returns the last measured ECG signal.

```sig
let signal = spikerbit.heartSignal();
```

#### `heartRate(): number`
Returns the calculated heart rate based on the last two heart beats.

```sig
let rate = spikerbit.heartRate();
```

### Brain Group

#### `startBrainRecording()`
Starts recording brain (EEG) signals.

```sig
spikerbit.startBrainRecording();
```

#### `brainSignal(): number`
Returns the last measured EEG signal.

```sig
let signal = spikerbit.brainSignal();
```

#### `brainAlphaPower(): number`
Returns the alpha wave power of the EEG signal.

```sig
let alphaPower = spikerbit.brainAlphaPower();
```

### Helper Utility

#### `print(value: number): void`
The `print` function sends a numeric value to the serial output with the label `"Value"`.  
This allows students and teachers to easily record or visualize data in MakeCode Data Logger or any serial monitoring tool.  

You can use it to print measurements from any Spiker:Bit signal, such as the EMG envelope, raw ECG or EEG values, heart rate, or EEG alpha power.

```sig
spikerbit.print(spikerbit.heartRate());
```

#### `signalBlock(): number[]`
Returns a array of the **raw recorded signal** from the internal buffer, sampled at 250 Hz (one value every 4 ms).  

Key behaviour:
- **Input (optional)**
  - the time window (in milliseconds) of past data to return.  
  - Default = 1000 ms (≈1 second).  
  - The maximum allowed value is 1000 ms, which corresponds to the buffer size.
- **Output**
  - An array of numbers, each element being one recorded sample.  
  - The length of the array is `durationMs / 4` (rounded down), since samples are collected every 4 ms.
- **Signal type**
  - The function returns whatever signal is currently being recorded:
    - **EMG** → EMG envelope (muscle power signal)  
    - **ECG** → raw heart signal  
    - **EEG** → raw EEG values 
- **Buffer / limits**
  - The internal buffer stores up to 250 samples (≈1 second). If `durationMs` is larger than what the buffer contains, the function just returns the available samples.
- **Edge cases**
  - If the buffer is empty (e.g., recording hasn’t started yet), the returned array will also be empty.

```sig
let signalBlock = spikerbit.signalBlock();
let shortSignalBlock = spikerbit.signalBlock(500);
```
#### `maxSignalInLast(durationMs: number): number`
Returns max value of signal for the specified duration in milliseconds.
For EMG it returns max of power (envelope) of the signal. For EEG and ECG it returns max of raw signal. 
Uses an internal buffer sampled at 250 Hz. 

```sig
let maxDuringLastSecond = spikerbit.maxSignalInLast(950);
```
#### `numPeaksInLast(durationMs: number): number`
Returns the number of peaks in the signal for the specified duration in milliseconds.

```sig
let numPeaks = spikerbit.numPeaksInLast(950);
```
#### Metadata (used for search, rendering)

* for PXT/microbit
