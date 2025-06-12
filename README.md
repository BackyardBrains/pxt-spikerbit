

## Spiker:Bit extension 

![MakeCode](https://img.shields.io/badge/for%20PXT-micro:bit-blue) • EMG • EEG • ECG

This extension enables the use of the Backyard Brains Spiker:Bit with the Microsoft MakeCode editor. 
The Spiker:Bit records electrical activity from the brain (EEG), muscles (EMG), and heart (ECG), making neuroscience and physiology experiments accessible in educational settings. Use this extension to create interactive projects and explore real-time bio-signals in your classroom or lab
For more details about the Spiker:Bit please check our product page [https://backyardbrains.com/products/](https://backyardbrains.com/products/)

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/BackyardBrains/pxt-spikerbit** and import

## Edit this project

To edit this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/BackyardBrains/pxt-spikerbit** and click import


Here is the API description and examples formatted for a GitHub README file:

---

## API Functions

### Muscle Group

#### `startMuscleRecording()`
Starts recording muscle (EMG) signals.

```typescript
spikerbit.startMuscleRecording();
```

#### `musclePowerSignal(): number`
Returns the last envelope value of the EMG signal.

```typescript
let power = spikerbit.musclePowerSignal();
```

#### `muscleRawsignal(): number`
Returns the raw EMG signal.

```typescript
let rawSignal = spikerbit.muscleRawsignal();
```

### Heart Group

#### `startHeartRecording()`
Starts recording heart (ECG) signals.

```typescript
spikerbit.startHeartRecording();
```

#### `heartSignal(): number`
Returns the last measured ECG signal.

```typescript
let signal = spikerbit.heartSignal();
```

#### `heartRate(): number`
Returns the calculated heart rate based on the last two heart beats.

```typescript
let rate = spikerbit.heartRate();
```

### Brain Group

#### `startBrainRecording()`
Starts recording brain (EEG) signals.

```typescript
spikerbit.startBrainRecording();
```

#### `brainSignal(): number`
Returns the last measured EEG signal.

```typescript
let signal = spikerbit.brainSignal();
```

#### `brainAlphaPower(): number`
Returns the alpha wave power of the EEG signal.

```typescript
let alphaPower = spikerbit.brainAlphaPower();
```

### Helper Utility

#### `print(value: number): void`
Prints the signal value to the serial output.

```typescript
spikerbit.print(spikerbit.heartRate());
```

#### `signalBlock(): number[]`
Returns the recorded signal block for the last 3 seconds. If you pass durationMs parameter it will return just last durationMs of data.

```typescript
let signalBlock = spikerbit.signalBlock();
let shortSignalBlock = spikerbit.signalBlock(500);
```

#### `maxSignalInLast(durationMs: number): number`
Returns max value of signal for the specified duration in milliseconds.
For EMG it returns max of power (envelope) of the signal. For EEG and ECG it returns max of raw signal. 
Uses an internal buffer sampled at 250 Hz. 

```typescript
let maxDuringLastSecond = maxSignalInLast(1000);
```
#### `numPeaksInLast(durationMs: number): number`
Returns the number of peaks in the signal for the specified duration in milliseconds.

```typescript
let numPeaks = numPeaksInLast(1000);
```

#### Metadata (used for search, rendering)

* for PXT/microbit
