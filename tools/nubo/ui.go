package main

import (
	"context"
	"fmt"
	"io"
	"strings"

	"charm.land/bubbles/v2/spinner"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

type palette struct {
	color   bool
	accent  lipgloss.Style
	heading lipgloss.Style
	muted   lipgloss.Style
	success lipgloss.Style
	error   lipgloss.Style
	key     lipgloss.Style
}

func newPalette(color bool) palette {
	if !color {
		return palette{}
	}
	return palette{
		color:   true,
		accent:  lipgloss.NewStyle().Foreground(lipgloss.Color("3")),
		heading: lipgloss.NewStyle().Bold(true),
		muted:   lipgloss.NewStyle().Foreground(lipgloss.Color("8")),
		success: lipgloss.NewStyle().Foreground(lipgloss.Color("2")),
		error:   lipgloss.NewStyle().Foreground(lipgloss.Color("1")),
		key:     lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("3")),
	}
}

func (p palette) adapt(dark bool) palette {
	if !p.color {
		return p
	}
	choose := lipgloss.LightDark(dark)
	return palette{
		color:   true,
		accent:  lipgloss.NewStyle().Foreground(choose(lipgloss.Color("#A64B2A"), lipgloss.Color("#E58A68"))),
		heading: lipgloss.NewStyle().Bold(true),
		muted:   lipgloss.NewStyle().Foreground(choose(lipgloss.Color("#6B625B"), lipgloss.Color("#A99F93"))),
		success: lipgloss.NewStyle().Foreground(choose(lipgloss.Color("#287A4B"), lipgloss.Color("#79B791"))),
		error:   lipgloss.NewStyle().Foreground(choose(lipgloss.Color("#B42318"), lipgloss.Color("#FF7B72"))),
		key:     lipgloss.NewStyle().Bold(true).Foreground(choose(lipgloss.Color("#8A4B08"), lipgloss.Color("#E8B17D"))),
	}
}

func render(style lipgloss.Style, value string) string {
	if style.GetForeground() == nil && !style.GetBold() {
		return value
	}
	return style.Render(value)
}

type menuModel struct {
	palette palette
	version string
	cursor  int
	choice  string
	width   int
}

var menuItems = []struct{ key, title, description string }{
	{"download", "Runtime 준비", "공식 GOAPI와 libvips를 검증해 내려받습니다."},
	{"help", "명령 안내", "지원하는 작업과 안전 경계를 확인합니다."},
	{"exit", "나가기", "아무것도 변경하지 않습니다."},
}

func (m menuModel) Init() tea.Cmd { return nil }

func (m menuModel) Update(message tea.Msg) (tea.Model, tea.Cmd) {
	switch message := message.(type) {
	case tea.BackgroundColorMsg:
		m.palette = m.palette.adapt(message.IsDark())
	case tea.WindowSizeMsg:
		m.width = message.Width
	case tea.KeyPressMsg:
		switch message.String() {
		case "ctrl+c", "q", "esc":
			m.choice = "exit"
			return m, tea.Quit
		case "up", "k":
			if m.cursor > 0 {
				m.cursor--
			}
		case "down", "j":
			if m.cursor < len(menuItems)-1 {
				m.cursor++
			}
		case "enter", " ":
			m.choice = menuItems[m.cursor].key
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m menuModel) View() tea.View {
	var body strings.Builder
	body.WriteString(render(m.palette.accent, "● NUBO"))
	body.WriteString("  ")
	body.WriteString(render(m.palette.muted, "작고 안전한 커뮤니티 도구 · "+m.version))
	body.WriteString("\n\n")
	body.WriteString(render(m.palette.heading, "무엇을 준비할까요?"))
	body.WriteString("\n\n")
	for index, item := range menuItems {
		pointer := "  "
		if index == m.cursor {
			pointer = render(m.palette.accent, "› ")
		}
		body.WriteString(pointer)
		body.WriteString(render(m.palette.key, item.title))
		body.WriteString("\n    ")
		body.WriteString(render(m.palette.muted, item.description))
		body.WriteString("\n\n")
	}
	body.WriteString(render(m.palette.muted, "↑↓ 이동  enter 선택  q 나가기"))
	return tea.NewView(body.String())
}

func runMenu(in io.Reader, out io.Writer, version string, color bool) (string, error) {
	result, err := tea.NewProgram(menuModel{palette: newPalette(color), version: version}, tea.WithInput(in), tea.WithOutput(out)).Run()
	if err != nil {
		return "", err
	}
	return result.(menuModel).choice, nil
}

type confirmModel struct {
	palette  palette
	version  string
	selected bool
	done     bool
}

func (m confirmModel) Init() tea.Cmd { return nil }
func (m confirmModel) Update(message tea.Msg) (tea.Model, tea.Cmd) {
	if background, ok := message.(tea.BackgroundColorMsg); ok {
		m.palette = m.palette.adapt(background.IsDark())
		return m, nil
	}
	if key, ok := message.(tea.KeyPressMsg); ok {
		switch key.String() {
		case "left", "right", "tab":
			m.selected = !m.selected
		case "y":
			m.selected, m.done = true, true
			return m, tea.Quit
		case "n", "esc", "q", "ctrl+c":
			m.selected, m.done = false, true
			return m, tea.Quit
		case "enter":
			m.done = true
			return m, tea.Quit
		}
	}
	return m, nil
}
func (m confirmModel) View() tea.View {
	yes, no := "  계속  ", "[ 취소 ]"
	if m.selected {
		yes, no = "[ 계속 ]", "  취소  "
	}
	content := render(m.palette.heading, "기존 runtime을 교체할까요?") + "\n\n" +
		fmt.Sprintf("GOAPI와 libvips를 NUBO %s 기준으로 준비합니다.\n", m.version) +
		render(m.palette.muted, "소스·DB·실행 중인 프로세스는 변경하지 않습니다.") + "\n\n" +
		render(m.palette.accent, yes) + "  " + render(m.palette.muted, no) + "\n\n" +
		render(m.palette.muted, "←→ 선택  enter 확인")
	return tea.NewView(content)
}

func runConfirm(in io.Reader, out io.Writer, version string, color bool) (bool, error) {
	result, err := tea.NewProgram(confirmModel{palette: newPalette(color), version: version}, tea.WithInput(in), tea.WithOutput(out)).Run()
	if err != nil {
		return false, err
	}
	model := result.(confirmModel)
	return model.done && model.selected, nil
}

type eventKind string

const (
	eventStage    eventKind = "stage"
	eventProgress eventKind = "progress"
	eventDone     eventKind = "done"
)

type taskEvent struct {
	Kind    eventKind
	Title   string
	Detail  string
	Current int64
	Total   int64
}

type taskEventMsg taskEvent
type taskClosedMsg struct{}

type taskModel struct {
	palette   palette
	spinner   spinner.Model
	events    <-chan taskEvent
	cancel    context.CancelFunc
	lines     []taskEvent
	current   taskEvent
	done      bool
	cancelled bool
}

func waitForTaskEvent(events <-chan taskEvent) tea.Cmd {
	return func() tea.Msg {
		event, ok := <-events
		if !ok {
			return taskClosedMsg{}
		}
		return taskEventMsg(event)
	}
}

func (m taskModel) Init() tea.Cmd {
	return tea.Batch(m.spinner.Tick, waitForTaskEvent(m.events))
}

func (m taskModel) Update(message tea.Msg) (tea.Model, tea.Cmd) {
	switch message := message.(type) {
	case tea.BackgroundColorMsg:
		m.palette = m.palette.adapt(message.IsDark())
		m.spinner.Style = m.palette.accent
		return m, nil
	case tea.KeyPressMsg:
		if message.String() == "ctrl+c" || message.String() == "q" || message.String() == "esc" {
			if !m.cancelled {
				m.cancelled = true
				m.cancel()
				m.current = taskEvent{Kind: eventStage, Title: "안전하게 취소하는 중", Detail: "기존 runtime 유지"}
			}
			return m, nil
		}
	case spinner.TickMsg:
		updated, command := m.spinner.Update(message)
		m.spinner = updated
		return m, command
	case taskEventMsg:
		event := taskEvent(message)
		if event.Kind == eventProgress {
			m.current = event
		} else {
			if m.current.Title != "" {
				m.lines = append(m.lines, taskEvent{Kind: eventStage, Title: m.current.Title, Detail: "완료"})
			}
			m.current = event
		}
		return m, waitForTaskEvent(m.events)
	case taskClosedMsg:
		m.done = true
		return m, tea.Quit
	}
	return m, nil
}

func (m taskModel) View() tea.View {
	var body strings.Builder
	body.WriteString(render(m.palette.accent, "● NUBO Runtime"))
	body.WriteString("\n\n")
	for _, line := range m.lines {
		body.WriteString(render(m.palette.success, "✓ "))
		body.WriteString(line.Title)
		if line.Detail != "" {
			body.WriteString(render(m.palette.muted, "  "+line.Detail))
		}
		body.WriteString("\n")
	}
	if !m.done && m.current.Title != "" {
		body.WriteString(m.spinner.View())
		body.WriteString(" ")
		body.WriteString(m.current.Title)
		if m.current.Total > 0 {
			body.WriteString(render(m.palette.muted, fmt.Sprintf("  %d%%", m.current.Current*100/m.current.Total)))
		} else if m.current.Detail != "" {
			body.WriteString(render(m.palette.muted, "  "+m.current.Detail))
		}
		body.WriteString("\n")
	}
	body.WriteString("\n")
	body.WriteString(render(m.palette.muted, "ctrl+c 취소 · 기존 runtime은 설치가 끝날 때까지 유지됩니다."))
	return tea.NewView(body.String())
}

func runTaskUI(cancel context.CancelFunc, in io.Reader, out io.Writer, color bool, task func(func(taskEvent))) error {
	events := make(chan taskEvent, 256)
	go func() {
		defer close(events)
		task(func(event taskEvent) { events <- event })
	}()
	indicator := spinner.New(spinner.WithSpinner(spinner.MiniDot), spinner.WithStyle(newPalette(color).accent))
	_, err := tea.NewProgram(taskModel{palette: newPalette(color), spinner: indicator, events: events, cancel: cancel}, tea.WithInput(in), tea.WithOutput(out)).Run()
	return err
}

func runPlainTask(out io.Writer, task func(func(taskEvent))) {
	lastProgress := -1
	task(func(event taskEvent) {
		if event.Kind == eventProgress && event.Total > 0 {
			percentage := int(event.Current * 100 / event.Total)
			if percentage/10 == lastProgress/10 {
				return
			}
			lastProgress = percentage
			fmt.Fprintf(out, "  %s %d%%\n", event.Title, percentage)
			return
		}
		if event.Title != "" {
			fmt.Fprintf(out, "• %s", event.Title)
			if event.Detail != "" {
				fmt.Fprintf(out, " — %s", event.Detail)
			}
			fmt.Fprintln(out)
		}
	})
}
