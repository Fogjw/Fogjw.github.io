---
title: Rust学习项目——mini-redis-lite
date: 2026-07-17 18:23:55
cover: /img/cg_sk07_0101.png
tags:
  - 总结
  - 反思
  - Rust
categories:
  - 项目笔记
---
# Rust学习项目 ———— mini-redis-lite

## 项目地址

项目仓库地址：[mini-redis-lite](https://github.com/Fogjw/mini-redis-lite)

## 前言

笔者的一门有关**Rust**的选课要求自行选题写一个项目，本着多学一门语言是有益之举的想法，我决定不全盘Vibe Coding，在agent的指导下建立项目。

出于agent的建议，选择了复刻redis的一部分功能，即存，取，删，具体见项目仓库readme。

## 我学到了什么

对于这个项目的核心功能本身，即存取和删除键值对的实现实际上是毫不费力的，重要的是这个项目与操作系统的相关知识联系在了一起，让我第一次切实地在编程中考虑到操作系统。

### 1. 同步原语

为了实现多线程并发访问键值对数据，必须保证临界区的互斥访问，即同一时间，只有**一个**客户端线程能读写键值对，在本项目中，引入了Rust的同步原语模块 **sync** 中的原子引用计数 **Arc** 和互斥锁 **Mutex** 来解决这个问题。
    内存存储MemoryStorage结构体定义：

```Rust
#[derive(Clone)]
pub struct MemoryStorage {
    data: Arc<Mutex<HashMap<String, String>>>,
}
```

在HashMap的基础上，Mutex提供了互斥锁，而Arc使多个线程能够共享这个存储空间。
Rust 的 Arc<Mutex<T></t>> 的使用相当便利，编译器会自动在离开临界区时释放锁，这一点和可变借用 &mut 的所有权归还异曲同工。

```Rust
// 设置键值对
fn set(&self, key: String, value: String) -> Result<(), StorageError> {
    // 获取锁，失败返回 StorageError::Internal
    let mut map = self
        .data
        .lock()
        .map_err(|e| StorageError::Internal(format!("lock poisoned: {}", e)))?;
    // 插入键值对
    map.insert(key, value);
    // 返回 Ok(())
    Ok(())
}
```

### 2. 文件崩溃一致性

由于设置、改动的键值对在程序重启后应该能够继续使用，键值对数据必须保存到本地文件，换言之，需要与磁盘交互。因此为了避免出现系统崩溃而导致键值对丢失或不一致，本项目使用日志存储，每一次写操作都先记录到日志文件，再对内存数据进行操作，确保每次操作时磁盘数据已经至少更新到上一步操作完成的状态。
而日志文件选用了AOF（Append-Only File）文件，只做增量存储，每次服务器端重启后按日志进行回访复现关闭服务器时的数据。
持久化存储PersistentStorage结构体定义：

```Rust
/// 持久化存储 —— 包装 MemoryStorage 并追加写 AOF 日志
pub struct PersistentStorage {
    /// 底层内存存储
    memory: MemoryStorage,
    /// AOF 日志文件句柄，写操作通过Mutex串行化
    aof_file: Mutex<File>,
}
```

每次写操作必须先执行一次记录日志：

```Rust
/// 将一行文本追加到 AOF 日志文件
///
/// 写操作必须**先写日志**再写内存，
/// 保证崩溃后 AOF 文件完整性优先。
fn append_to_aof(&self, line: &str) -> Result<(), StorageError> {
    let mut file = self
        .aof_file
        .lock()
        .map_err(|e| StorageError::Internal(format!("aof lock poisoned: {}", e)))?;
    writeln!(file, "{}", line)?;
    file.flush()?; //刷盘，确保日志写入磁盘
    Ok(())
}
```

但是这样也有缺点，每次操作都必须先与磁盘交互再与内存交互，虽然极大地提高了数据严谨性，但是不可避免地使处理速度减慢，同时恢复数据的方法是回放所有写操作，这也使得服务器重启后恢复数据所需要的时间也会越来越长。在这方面，项目有待继续进行更进一步地优化。

## 除此之外

除了操作系统的相关知识之外，这次也用到了一些计算机网络的相关内容，但是只用到了简单的TCP通信，就不详述了。值得一提的是，本项目的消息定界借鉴了 Redis 的 **RESP** 协议，格式如下：

| 类型       | 前缀                  | 格式            | 示例           | 场景         |
| ---------- | --------------------- | --------------- | -------------- | ------------ |
| 成功确认   | `+`  |     `+OK\r\n`         | `+OK\r\n`            | SET/DEL/CLEAR 成功 |
| 批量字符串 | `$`    |      `$len\r\ndata\r\n` | `$5\r\nAlice\r\n` | GET 返回值     |
| 空值       | `$`    |     `$-1\r\n`        | `$-1\r\n`             | 键不存在       |
| 错误       | `-`   |     `-msg\r\n`        | `-ERR not found\r\n` | 命令解析失败 |

本次项目只实现了redis的一部分功能，因此RESP协议也仅仅实现了上述四种格式，但是也让我学到不少，比如像表中所示，使用前缀能方便接收方快速定性报文类型，迅速采取对应处理。而批量字符串的**长度行+数据行**方法让接收方更好地预估报文长度，提前分配合适的空间接收报文，这些都是值得学习的思想。

## 碎碎念
本项目是笔者第一次使用Rust编程语言的练手项目，对于Rust语言，笔者深切地感受到它与C/C++、python等编程语言的不同，Rust的所有权作为其核心特点一直贯穿整个开发过程，令人头疼不已。但是笔者也确实感受到了Rust由此带来的内存安全的严谨性，虽然对Rust很不适应，但是感受到了它的巨大潜力，如果有机会也许还会使用Rust做一些开发吧。
