# My Journey at 1337 Coding School

**Published:** December 15, 2025

---

## The Beginning

Walking into 1337 for the first time felt surreal. No teachers, no lectures, no textbooks — just you, your peers, and an army of iMacs. The 42 Network's philosophy is radical: **learn by doing, teach by sharing**.

The Piscine (the month-long selection process) was the most intense learning experience of my life. Sleeping at the school, debugging at 3 AM, and discovering that `segfault` would become my most frequent companion.

## The Peer-to-Peer Model

What makes 1337 special is the absence of traditional teaching. When you're stuck on a problem, you don't raise your hand — you turn to the person next to you. This creates a culture where:

- **Everyone is both a student and a teacher**
- You learn to explain complex concepts simply
- Collaboration becomes second nature
- You develop debugging skills through helping others

## Projects That Shaped Me

### Libft — Building My Own C Library

The first real project. Reimplementing standard C library functions from scratch taught me more about memory management than any textbook could. When your `ft_strdup` leaks memory, you *feel* it.

```c
char *ft_strdup(const char *s)
{
    char *dup;
    size_t len;

    len = ft_strlen(s) + 1;
    dup = (char *)malloc(len);
    if (!dup)
        return (NULL);
    ft_memcpy(dup, s, len);
    return (dup);
}
```

### ft_printf — Understanding Variadic Functions

Recreating `printf` was a deep dive into variadic arguments, format specifiers, and edge cases I never knew existed. Did you know `printf("%")` has undefined behavior?

### get_next_line — The Art of Static Variables

Reading a file line by line sounds simple until you need to handle:
- Any buffer size
- Multiple file descriptors simultaneously  
- Memory leaks (the eternal enemy)

### push_swap — Algorithm Optimization

Sorting numbers with two stacks and a limited set of operations. This project taught me that the difference between a good and great solution can be hundreds of operations.

## What I've Learned

1. **Patience is a superpower.** Some projects took weeks. Learning to stay calm when nothing works is invaluable.
2. **Reading code is as important as writing it.** Peer evaluation means reading hundreds of different implementations.
3. **There's always a better way.** Seeing how others solve the same problem opens your mind.
4. **Low-level understanding matters.** Knowing what happens under the hood makes you a better developer in any language.

## Looking Forward

As I advance through the curriculum into C++ and more complex projects, I carry with me the most important lesson 1337 taught me: **the best way to learn is to build**.

---

*If you're considering joining 1337 or any 42 school, my advice: do it. It will be the hardest and most rewarding experience of your programming life.*
